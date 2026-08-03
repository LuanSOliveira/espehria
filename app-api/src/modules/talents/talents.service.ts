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
import { CreateTalentDto } from './dto/create-talent.dto';
import { UpdateTalentDto } from './dto/update-talent.dto';
import { FindTalentsQueryDto } from './dto/find-talents-query.dto';
import { Talent } from './entities/talent.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksService } from '../entity-links/entity-links.service';
import { EntityLinkType } from '../entity-links/enums/entity-link-type.enum';
import { ReferenceableEntityType } from '../entity-links/enums/referenceable-entity-type.enum';
import { EntityReferenceInputDto } from '../entity-links/dto/entity-reference-input.dto';
import { EntityReferenceResponseDto } from '../entity-links/dto/entity-reference-response.dto';
import { ImprovementFlawsService } from '../improvement-flaws/improvement-flaws.service';
import { ImprovementFlawOwnerType } from '../improvement-flaws/enums/improvement-flaw-owner-type.enum';
import { ImprovementFlawCategory } from '../improvement-flaws/enums/improvement-flaw-category.enum';
import { ImprovementFlawItemInputDto } from '../improvement-flaws/dto/improvement-flaw-item-input.dto';
import { ImprovementFlawItemResponseDto } from '../improvement-flaws/dto/improvement-flaw-item-response.dto';

export interface PaginatedTalents {
  data: Talent[];
  total: number;
  page: number;
  perPage: number;
}

export interface TalentWithReferences {
  talent: Talent;
  improvedFrom: EntityReferenceResponseDto[];
  requirements: EntityReferenceResponseDto[];
  additionalAbilities: EntityReferenceResponseDto[];
  improvements: ImprovementFlawItemResponseDto[];
  flaws: ImprovementFlawItemResponseDto[];
}

@Injectable()
export class TalentsService {
  constructor(
    @InjectRepository(Talent)
    private readonly talentsRepository: Repository<Talent>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
    private readonly improvementFlawsService: ImprovementFlawsService,
  ) {}

  findByName(name: string): Promise<Talent | null> {
    return this.talentsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<TalentWithReferences | null> {
    const talent = await this.talentsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!talent) {
      return null;
    }

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TALENT,
        id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.TALENT,
        id,
      );

    return {
      talent,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
    };
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  async create(dto: CreateTalentDto): Promise<TalentWithReferences> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um talento com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const improvedFromInput = dto.improvedFrom ?? [];
    const requirementsInput = dto.requirements ?? [];
    const additionalAbilitiesInput = dto.additionalAbilities ?? [];
    const improvementsInput = dto.improvements ?? [];
    const flawsInput = dto.flaws ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.TALENT,
      improvedFrom: improvedFromInput,
      requirements: requirementsInput,
      additionalAbilities: additionalAbilitiesInput,
    });

    await this.entityLinksService.resolveReferences(improvedFromInput);
    await this.entityLinksService.resolveReferences(requirementsInput);
    await this.entityLinksService.resolveReferences(additionalAbilitiesInput);

    const resolvedImprovements =
      await this.improvementFlawsService.validateAndResolveItems(
        improvementsInput,
      );
    const resolvedFlaws =
      await this.improvementFlawsService.validateAndResolveItems(flawsInput);
    this.improvementFlawsService.validateLists({
      improvements: improvementsInput,
      flaws: flawsInput,
    });

    const talent = this.talentsRepository.create({
      name: dto.name,
      level: dto.level,
      description: dto.description ?? null,
      tags,
    });

    const savedTalent = await this.talentsRepository.save(talent);

    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.TALENT,
      savedTalent.id,
      EntityLinkType.IMPROVED_FROM,
      improvedFromInput,
    );
    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.TALENT,
      savedTalent.id,
      EntityLinkType.REQUIREMENT,
      requirementsInput,
    );
    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.TALENT,
      savedTalent.id,
      EntityLinkType.ADDITIONAL_ABILITY,
      additionalAbilitiesInput,
    );

    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.TALENT,
      savedTalent.id,
      ImprovementFlawCategory.IMPROVEMENT,
      improvementsInput,
      resolvedImprovements,
    );
    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.TALENT,
      savedTalent.id,
      ImprovementFlawCategory.FLAW,
      flawsInput,
      resolvedFlaws,
    );

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TALENT,
        savedTalent.id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.TALENT,
        savedTalent.id,
      );

    return {
      talent: savedTalent,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
    };
  }

  async findAllPaginated(
    query: FindTalentsQueryDto,
  ): Promise<PaginatedTalents> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.talentsRepository.createQueryBuilder('talent');

    if (query.name) {
      queryBuilder.andWhere('talent.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['talent.id', 'talent.name'])
      .orderBy('talent.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const talents = await this.talentsRepository.find({
      where: { id: In(ids.map((talent) => talent.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const talentsById = new Map(talents.map((talent) => [talent.id, talent]));
    const data = ids
      .map((talent) => talentsById.get(talent.id))
      .filter((talent): talent is Talent => talent !== undefined);

    return { data, total, page, perPage };
  }

  async update(
    id: string,
    dto: UpdateTalentDto,
  ): Promise<TalentWithReferences> {
    const talent = await this.talentsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!talent) {
      throw new NotFoundException('Talento não encontrado.');
    }

    if (dto.name && dto.name !== talent.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um talento com este nome.');
      }
      talent.name = dto.name;
    }

    if (dto.level !== undefined) {
      talent.level = dto.level;
    }
    if (dto.description !== undefined) {
      talent.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      talent.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    let effectiveImprovedFrom = dto.improvedFrom;
    let effectiveRequirements = dto.requirements;
    let effectiveAdditionalAbilities = dto.additionalAbilities;

    if (
      effectiveImprovedFrom === undefined ||
      effectiveRequirements === undefined ||
      effectiveAdditionalAbilities === undefined
    ) {
      const current = await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TALENT,
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
      if (effectiveAdditionalAbilities === undefined) {
        effectiveAdditionalAbilities = current.additionalAbilities.map(
          (ref): EntityReferenceInputDto => ({
            entityType: ref.entityType,
            id: ref.id,
          }),
        );
      }
    }

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.TALENT,
      ownerId: id,
      improvedFrom: effectiveImprovedFrom,
      requirements: effectiveRequirements,
      additionalAbilities: effectiveAdditionalAbilities,
    });

    if (dto.improvedFrom !== undefined) {
      await this.entityLinksService.resolveReferences(dto.improvedFrom);
    }
    if (dto.requirements !== undefined) {
      await this.entityLinksService.resolveReferences(dto.requirements);
    }
    if (dto.additionalAbilities !== undefined) {
      await this.entityLinksService.resolveReferences(dto.additionalAbilities);
    }

    let effectiveImprovements = dto.improvements;
    let effectiveFlaws = dto.flaws;

    if (effectiveImprovements === undefined || effectiveFlaws === undefined) {
      const currentItems = await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.TALENT,
        id,
      );
      if (effectiveImprovements === undefined) {
        effectiveImprovements = currentItems.improvements.map(
          (item): ImprovementFlawItemInputDto => ({
            value: item.value,
            type: item.type.id,
            property: item.property.id,
          }),
        );
      }
      if (effectiveFlaws === undefined) {
        effectiveFlaws = currentItems.flaws.map(
          (item): ImprovementFlawItemInputDto => ({
            value: item.value,
            type: item.type.id,
            property: item.property.id,
          }),
        );
      }
    }

    const resolvedImprovements =
      await this.improvementFlawsService.validateAndResolveItems(
        effectiveImprovements,
      );
    const resolvedFlaws =
      await this.improvementFlawsService.validateAndResolveItems(
        effectiveFlaws,
      );
    this.improvementFlawsService.validateLists({
      improvements: effectiveImprovements,
      flaws: effectiveFlaws,
    });

    const savedTalent = await this.talentsRepository.save(talent);

    if (dto.improvedFrom !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.TALENT,
        id,
        EntityLinkType.IMPROVED_FROM,
        dto.improvedFrom,
      );
    }
    if (dto.requirements !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.TALENT,
        id,
        EntityLinkType.REQUIREMENT,
        dto.requirements,
      );
    }
    if (dto.additionalAbilities !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.TALENT,
        id,
        EntityLinkType.ADDITIONAL_ABILITY,
        dto.additionalAbilities,
      );
    }
    if (dto.improvements !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.TALENT,
        id,
        ImprovementFlawCategory.IMPROVEMENT,
        dto.improvements,
        resolvedImprovements,
      );
    }
    if (dto.flaws !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.TALENT,
        id,
        ImprovementFlawCategory.FLAW,
        dto.flaws,
        resolvedFlaws,
      );
    }

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TALENT,
        id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.TALENT,
        id,
      );

    return {
      talent: savedTalent,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
    };
  }

  async remove(id: string): Promise<void> {
    const result = await this.talentsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Talento não encontrado.');
    }
  }
}
