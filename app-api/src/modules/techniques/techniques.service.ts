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
import { CreateTechniqueDto } from './dto/create-technique.dto';
import { UpdateTechniqueDto } from './dto/update-technique.dto';
import { FindTechniquesQueryDto } from './dto/find-techniques-query.dto';
import { Technique } from './entities/technique.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksService } from '../entity-links/entity-links.service';
import { EntityLinkType } from '../entity-links/enums/entity-link-type.enum';
import { ReferenceableEntityType } from '../entity-links/enums/referenceable-entity-type.enum';
import { EntityReferenceInputDto } from '../entity-links/dto/entity-reference-input.dto';
import { EntityReferenceResponseDto } from '../entity-links/dto/entity-reference-response.dto';

export interface PaginatedTechniques {
  data: Technique[];
  total: number;
  page: number;
  perPage: number;
}

export interface TechniqueWithReferences {
  technique: Technique;
  improvedFrom: EntityReferenceResponseDto[];
  requirements: EntityReferenceResponseDto[];
}

@Injectable()
export class TechniquesService {
  constructor(
    @InjectRepository(Technique)
    private readonly techniquesRepository: Repository<Technique>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
  ) {}

  findByName(name: string): Promise<Technique | null> {
    return this.techniquesRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<TechniqueWithReferences | null> {
    const technique = await this.techniquesRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!technique) {
      return null;
    }

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TECHNIQUE,
        id,
      );

    return { technique, improvedFrom, requirements };
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  async create(dto: CreateTechniqueDto): Promise<TechniqueWithReferences> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma técnica com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const improvedFromInput = dto.improvedFrom ?? [];
    const requirementsInput = dto.requirements ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.TECHNIQUE,
      improvedFrom: improvedFromInput,
      requirements: requirementsInput,
    });

    await this.entityLinksService.resolveReferences(improvedFromInput);
    await this.entityLinksService.resolveReferences(requirementsInput);

    const technique = this.techniquesRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      tags,
    });

    const savedTechnique = await this.techniquesRepository.save(technique);

    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.TECHNIQUE,
      savedTechnique.id,
      EntityLinkType.IMPROVED_FROM,
      improvedFromInput,
    );
    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.TECHNIQUE,
      savedTechnique.id,
      EntityLinkType.REQUIREMENT,
      requirementsInput,
    );

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TECHNIQUE,
        savedTechnique.id,
      );

    return { technique: savedTechnique, improvedFrom, requirements };
  }

  async findAllPaginated(
    query: FindTechniquesQueryDto,
  ): Promise<PaginatedTechniques> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.techniquesRepository.createQueryBuilder('technique');

    if (query.name) {
      queryBuilder.andWhere('technique.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['technique.id', 'technique.name'])
      .orderBy('technique.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const techniques = await this.techniquesRepository.find({
      where: { id: In(ids.map((technique) => technique.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const techniquesById = new Map(
      techniques.map((technique) => [technique.id, technique]),
    );
    const data = ids
      .map((technique) => techniquesById.get(technique.id))
      .filter((technique): technique is Technique => technique !== undefined);

    return { data, total, page, perPage };
  }

  async update(
    id: string,
    dto: UpdateTechniqueDto,
  ): Promise<TechniqueWithReferences> {
    const technique = await this.techniquesRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!technique) {
      throw new NotFoundException('Técnica não encontrada.');
    }

    if (dto.name && dto.name !== technique.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma técnica com este nome.');
      }
      technique.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      technique.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      technique.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      technique.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    let effectiveImprovedFrom = dto.improvedFrom;
    let effectiveRequirements = dto.requirements;

    if (
      effectiveImprovedFrom === undefined ||
      effectiveRequirements === undefined
    ) {
      const current = await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TECHNIQUE,
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
      ownerEntityType: ReferenceableEntityType.TECHNIQUE,
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

    const savedTechnique = await this.techniquesRepository.save(technique);

    if (dto.improvedFrom !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.TECHNIQUE,
        id,
        EntityLinkType.IMPROVED_FROM,
        dto.improvedFrom,
      );
    }
    if (dto.requirements !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.TECHNIQUE,
        id,
        EntityLinkType.REQUIREMENT,
        dto.requirements,
      );
    }

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TECHNIQUE,
        id,
      );

    return { technique: savedTechnique, improvedFrom, requirements };
  }

  async remove(id: string): Promise<void> {
    const result = await this.techniquesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Técnica não encontrada.');
    }
  }
}
