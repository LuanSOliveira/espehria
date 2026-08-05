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
import {
  createOrderedTagJunctions,
  loadOrderedTagsForOwner,
  loadOrderedTagsMap,
  replaceOrderedTagJunctions,
} from '../../common/utils/ordered-tags.util';
import { CreateTechniqueDto } from './dto/create-technique.dto';
import { UpdateTechniqueDto } from './dto/update-technique.dto';
import { FindTechniquesQueryDto } from './dto/find-techniques-query.dto';
import { Technique } from './entities/technique.entity';
import { TechniqueTag } from './entities/technique-tag.entity';
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
    @InjectRepository(TechniqueTag)
    private readonly techniqueTagsRepository: Repository<TechniqueTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
  ) {}

  findByName(name: string): Promise<Technique | null> {
    return this.techniquesRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<TechniqueWithReferences | null> {
    const technique = await this.techniquesRepository.findOneBy({ id });
    if (!technique) {
      return null;
    }
    technique.tags = await loadOrderedTagsForOwner(
      this.techniqueTagsRepository,
      id,
      'technique',
    );

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
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    return uniqueIds.map((id) => tagsById.get(id)!);
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
      level: dto.level,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
    });

    const savedTechnique = await this.techniquesRepository.save(technique);
    await createOrderedTagJunctions(
      this.techniqueTagsRepository,
      'technique',
      savedTechnique,
      tags,
    );
    savedTechnique.tags = tags;

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
      order: { name: 'ASC' },
    });

    const tagsByTechniqueId = await loadOrderedTagsMap(
      this.techniqueTagsRepository,
      techniques.map((technique) => technique.id),
      'technique',
    );
    for (const technique of techniques) {
      technique.tags = tagsByTechniqueId.get(technique.id) ?? [];
    }

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
    const technique = await this.techniquesRepository.findOneBy({ id });
    if (!technique) {
      throw new NotFoundException('Técnica não encontrada.');
    }
    technique.tags = await loadOrderedTagsForOwner(
      this.techniqueTagsRepository,
      id,
      'technique',
    );

    if (dto.name && dto.name !== technique.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma técnica com este nome.');
      }
      technique.name = dto.name;
    }

    if (dto.level !== undefined) {
      technique.level = dto.level;
    }
    if (dto.referenceImage !== undefined) {
      technique.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      technique.description = dto.description;
    }
    let tags = technique.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.techniqueTagsRepository,
        'technique',
        technique,
        tags,
      );
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
    savedTechnique.tags = tags;

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
