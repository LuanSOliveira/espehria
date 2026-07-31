import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { FindTrainingsQueryDto } from './dto/find-trainings-query.dto';
import { Training } from './entities/training.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksService } from '../entity-links/entity-links.service';
import { EntityLinkType } from '../entity-links/enums/entity-link-type.enum';
import { ReferenceableEntityType } from '../entity-links/enums/referenceable-entity-type.enum';
import { EntityReferenceInputDto } from '../entity-links/dto/entity-reference-input.dto';
import { EntityReferenceResponseDto } from '../entity-links/dto/entity-reference-response.dto';

export interface PaginatedTrainings {
  data: Training[];
  total: number;
  page: number;
  perPage: number;
}

export interface TrainingWithReferences {
  training: Training;
  improvedFrom: EntityReferenceResponseDto[];
  requirements: EntityReferenceResponseDto[];
}

@Injectable()
export class TrainingsService {
  constructor(
    @InjectRepository(Training)
    private readonly trainingsRepository: Repository<Training>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
  ) {}

  findByName(name: string): Promise<Training | null> {
    return this.trainingsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<TrainingWithReferences | null> {
    const training = await this.trainingsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!training) {
      return null;
    }

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TRAINING,
        id,
      );

    return { training, improvedFrom, requirements };
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  async create(dto: CreateTrainingDto): Promise<TrainingWithReferences> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um treinamento com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const improvedFromInput = dto.improvedFrom ?? [];
    const requirementsInput = dto.requirements ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.TRAINING,
      improvedFrom: improvedFromInput,
      requirements: requirementsInput,
    });

    await this.entityLinksService.resolveReferences(improvedFromInput);
    await this.entityLinksService.resolveReferences(requirementsInput);

    const training = this.trainingsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      tags,
    });

    const savedTraining = await this.trainingsRepository.save(training);

    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.TRAINING,
      savedTraining.id,
      EntityLinkType.IMPROVED_FROM,
      improvedFromInput,
    );
    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.TRAINING,
      savedTraining.id,
      EntityLinkType.REQUIREMENT,
      requirementsInput,
    );

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TRAINING,
        savedTraining.id,
      );

    return { training: savedTraining, improvedFrom, requirements };
  }

  async findAllPaginated(
    query: FindTrainingsQueryDto,
  ): Promise<PaginatedTrainings> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.trainingsRepository.createQueryBuilder('training');

    if (query.name) {
      queryBuilder.andWhere('training.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['training.id', 'training.name'])
      .orderBy('training.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const trainings = await this.trainingsRepository.find({
      where: { id: In(ids.map((training) => training.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const trainingsById = new Map(
      trainings.map((training) => [training.id, training]),
    );
    const data = ids
      .map((training) => trainingsById.get(training.id))
      .filter((training): training is Training => training !== undefined);

    return { data, total, page, perPage };
  }

  async update(
    id: string,
    dto: UpdateTrainingDto,
  ): Promise<TrainingWithReferences> {
    const training = await this.trainingsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!training) {
      throw new NotFoundException('Treinamento não encontrado.');
    }

    if (dto.name && dto.name !== training.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException(
          'Já existe um treinamento com este nome.',
        );
      }
      training.name = dto.name;
    }

    if (dto.description !== undefined) {
      training.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      training.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    let effectiveImprovedFrom = dto.improvedFrom;
    let effectiveRequirements = dto.requirements;

    if (
      effectiveImprovedFrom === undefined ||
      effectiveRequirements === undefined
    ) {
      const current = await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TRAINING,
        id,
      );
      if (effectiveImprovedFrom === undefined) {
        effectiveImprovedFrom = current.improvedFrom.map(
          (ref): EntityReferenceInputDto => ({
            entityType: ref.entityType,
            id: ref.id,
          }),
        );
      }
      if (effectiveRequirements === undefined) {
        effectiveRequirements = current.requirements.map(
          (ref): EntityReferenceInputDto => ({
            entityType: ref.entityType,
            id: ref.id,
          }),
        );
      }
    }

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.TRAINING,
      ownerId: id,
      improvedFrom: effectiveImprovedFrom,
      requirements: effectiveRequirements,
    });

    if (dto.improvedFrom !== undefined) {
      await this.entityLinksService.resolveReferences(dto.improvedFrom);
    }
    if (dto.requirements !== undefined) {
      await this.entityLinksService.resolveReferences(dto.requirements);
    }

    const savedTraining = await this.trainingsRepository.save(training);

    if (dto.improvedFrom !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.TRAINING,
        id,
        EntityLinkType.IMPROVED_FROM,
        dto.improvedFrom,
      );
    }
    if (dto.requirements !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.TRAINING,
        id,
        EntityLinkType.REQUIREMENT,
        dto.requirements,
      );
    }

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TRAINING,
        id,
      );

    return { training: savedTraining, improvedFrom, requirements };
  }

  async remove(id: string): Promise<void> {
    const result = await this.trainingsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Treinamento não encontrado.');
    }
  }
}
