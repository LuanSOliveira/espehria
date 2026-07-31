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
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';
import { FindCharacteristicsQueryDto } from './dto/find-characteristics-query.dto';
import { Characteristic } from './entities/characteristic.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksService } from '../entity-links/entity-links.service';
import { EntityLinkType } from '../entity-links/enums/entity-link-type.enum';
import { ReferenceableEntityType } from '../entity-links/enums/referenceable-entity-type.enum';
import { EntityReferenceInputDto } from '../entity-links/dto/entity-reference-input.dto';
import { EntityReferenceResponseDto } from '../entity-links/dto/entity-reference-response.dto';

export interface PaginatedCharacteristics {
  data: Characteristic[];
  total: number;
  page: number;
  perPage: number;
}

export interface CharacteristicWithReferences {
  characteristic: Characteristic;
  improvedFrom: EntityReferenceResponseDto[];
  requirements: EntityReferenceResponseDto[];
}

@Injectable()
export class CharacteristicsService {
  constructor(
    @InjectRepository(Characteristic)
    private readonly characteristicsRepository: Repository<Characteristic>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
  ) {}

  findByName(name: string): Promise<Characteristic | null> {
    return this.characteristicsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<CharacteristicWithReferences | null> {
    const characteristic = await this.characteristicsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!characteristic) {
      return null;
    }

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.CHARACTERISTIC,
        id,
      );

    return { characteristic, improvedFrom, requirements };
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  async create(
    dto: CreateCharacteristicDto,
  ): Promise<CharacteristicWithReferences> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        'Já existe uma característica com este nome.',
      );
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const improvedFromInput = dto.improvedFrom ?? [];
    const requirementsInput = dto.requirements ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.CHARACTERISTIC,
      improvedFrom: improvedFromInput,
      requirements: requirementsInput,
    });

    await this.entityLinksService.resolveReferences(improvedFromInput);
    await this.entityLinksService.resolveReferences(requirementsInput);

    const characteristic = this.characteristicsRepository.create({
      name: dto.name,
      level: dto.level,
      description: dto.description ?? null,
      tags,
    });

    const savedCharacteristic =
      await this.characteristicsRepository.save(characteristic);

    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.CHARACTERISTIC,
      savedCharacteristic.id,
      EntityLinkType.IMPROVED_FROM,
      improvedFromInput,
    );
    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.CHARACTERISTIC,
      savedCharacteristic.id,
      EntityLinkType.REQUIREMENT,
      requirementsInput,
    );

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.CHARACTERISTIC,
        savedCharacteristic.id,
      );

    return { characteristic: savedCharacteristic, improvedFrom, requirements };
  }

  async findAllPaginated(
    query: FindCharacteristicsQueryDto,
  ): Promise<PaginatedCharacteristics> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.characteristicsRepository.createQueryBuilder(
      'characteristic',
    );

    if (query.name) {
      queryBuilder.andWhere('characteristic.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['characteristic.id', 'characteristic.name'])
      .orderBy('characteristic.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const characteristics = await this.characteristicsRepository.find({
      where: { id: In(ids.map((characteristic) => characteristic.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const characteristicsById = new Map(
      characteristics.map((characteristic) => [
        characteristic.id,
        characteristic,
      ]),
    );
    const data = ids
      .map((characteristic) => characteristicsById.get(characteristic.id))
      .filter(
        (characteristic): characteristic is Characteristic =>
          characteristic !== undefined,
      );

    return { data, total, page, perPage };
  }

  async update(
    id: string,
    dto: UpdateCharacteristicDto,
  ): Promise<CharacteristicWithReferences> {
    const characteristic = await this.characteristicsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!characteristic) {
      throw new NotFoundException('Característica não encontrada.');
    }

    if (dto.name && dto.name !== characteristic.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException(
          'Já existe uma característica com este nome.',
        );
      }
      characteristic.name = dto.name;
    }

    if (dto.level !== undefined) {
      characteristic.level = dto.level;
    }
    if (dto.description !== undefined) {
      characteristic.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      characteristic.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    let effectiveImprovedFrom = dto.improvedFrom;
    let effectiveRequirements = dto.requirements;

    if (
      effectiveImprovedFrom === undefined ||
      effectiveRequirements === undefined
    ) {
      const current = await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.CHARACTERISTIC,
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
      ownerEntityType: ReferenceableEntityType.CHARACTERISTIC,
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

    const savedCharacteristic =
      await this.characteristicsRepository.save(characteristic);

    if (dto.improvedFrom !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.CHARACTERISTIC,
        id,
        EntityLinkType.IMPROVED_FROM,
        dto.improvedFrom,
      );
    }
    if (dto.requirements !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.CHARACTERISTIC,
        id,
        EntityLinkType.REQUIREMENT,
        dto.requirements,
      );
    }

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.CHARACTERISTIC,
        id,
      );

    return { characteristic: savedCharacteristic, improvedFrom, requirements };
  }

  async remove(id: string): Promise<void> {
    const result = await this.characteristicsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Característica não encontrada.');
    }
  }
}
