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
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';
import { FindCharacteristicsQueryDto } from './dto/find-characteristics-query.dto';
import { Characteristic } from './entities/characteristic.entity';
import { CharacteristicTag } from './entities/characteristic-tag.entity';
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
import { ProficienciesService } from '../proficiencies/proficiencies.service';
import { ProficiencyOwnerType } from '../proficiencies/enums/proficiency-owner-type.enum';
import { ProficiencyItemInputDto } from '../proficiencies/dto/proficiency-item-input.dto';
import { ProficiencyItemResponseDto } from '../proficiencies/dto/proficiency-item-response.dto';
import { KnowledgesService } from '../knowledges/knowledges.service';
import { KnowledgeOwnerType } from '../knowledges/enums/knowledge-owner-type.enum';
import { KnowledgeItemInputDto } from '../knowledges/dto/knowledge-item-input.dto';
import { KnowledgeItemResponseDto } from '../knowledges/dto/knowledge-item-response.dto';

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
  additionalAbilities: EntityReferenceResponseDto[];
  improvements: ImprovementFlawItemResponseDto[];
  flaws: ImprovementFlawItemResponseDto[];
  proficiencies: ProficiencyItemResponseDto[];
  knowledges: KnowledgeItemResponseDto[];
}

@Injectable()
export class CharacteristicsService {
  constructor(
    @InjectRepository(Characteristic)
    private readonly characteristicsRepository: Repository<Characteristic>,
    @InjectRepository(CharacteristicTag)
    private readonly characteristicTagsRepository: Repository<CharacteristicTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
    private readonly improvementFlawsService: ImprovementFlawsService,
    private readonly proficienciesService: ProficienciesService,
    private readonly knowledgesService: KnowledgesService,
  ) {}

  findByName(name: string): Promise<Characteristic | null> {
    return this.characteristicsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<CharacteristicWithReferences | null> {
    const characteristic = await this.characteristicsRepository.findOneBy({
      id,
    });
    if (!characteristic) {
      return null;
    }
    characteristic.tags = await loadOrderedTagsForOwner(
      this.characteristicTagsRepository,
      id,
      'characteristic',
    );

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.CHARACTERISTIC,
        id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.CHARACTERISTIC,
        id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.CHARACTERISTIC,
      id,
    );
    const knowledges = await this.knowledgesService.loadItemsFor(
      KnowledgeOwnerType.CHARACTERISTIC,
      id,
    );

    return {
      characteristic,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    };
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
    const additionalAbilitiesInput = dto.additionalAbilities ?? [];
    const improvementsInput = dto.improvements ?? [];
    const flawsInput = dto.flaws ?? [];
    const proficienciesInput = dto.proficiencies ?? [];
    const knowledgesInput = dto.knowledges ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.CHARACTERISTIC,
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

    const resolvedProficiencies =
      await this.proficienciesService.validateAndResolveItems(
        proficienciesInput,
      );
    this.proficienciesService.validateList(proficienciesInput);

    const resolvedKnowledges =
      await this.knowledgesService.validateAndResolveItems(knowledgesInput);
    this.knowledgesService.validateList(knowledgesInput);

    const characteristic = this.characteristicsRepository.create({
      name: dto.name,
      level: dto.level,
      description: dto.description ?? null,
    });

    const savedCharacteristic =
      await this.characteristicsRepository.save(characteristic);
    await createOrderedTagJunctions(
      this.characteristicTagsRepository,
      'characteristic',
      savedCharacteristic,
      tags,
    );
    savedCharacteristic.tags = tags;

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
    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.CHARACTERISTIC,
      savedCharacteristic.id,
      EntityLinkType.ADDITIONAL_ABILITY,
      additionalAbilitiesInput,
    );

    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.CHARACTERISTIC,
      savedCharacteristic.id,
      ImprovementFlawCategory.IMPROVEMENT,
      improvementsInput,
      resolvedImprovements,
    );
    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.CHARACTERISTIC,
      savedCharacteristic.id,
      ImprovementFlawCategory.FLAW,
      flawsInput,
      resolvedFlaws,
    );
    await this.proficienciesService.replaceItems(
      ProficiencyOwnerType.CHARACTERISTIC,
      savedCharacteristic.id,
      proficienciesInput,
      resolvedProficiencies,
    );
    await this.knowledgesService.replaceItems(
      KnowledgeOwnerType.CHARACTERISTIC,
      savedCharacteristic.id,
      knowledgesInput,
      resolvedKnowledges,
    );

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.CHARACTERISTIC,
        savedCharacteristic.id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.CHARACTERISTIC,
        savedCharacteristic.id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.CHARACTERISTIC,
      savedCharacteristic.id,
    );
    const knowledges = await this.knowledgesService.loadItemsFor(
      KnowledgeOwnerType.CHARACTERISTIC,
      savedCharacteristic.id,
    );

    return {
      characteristic: savedCharacteristic,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    };
  }

  async findAllPaginated(
    query: FindCharacteristicsQueryDto,
  ): Promise<PaginatedCharacteristics> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.characteristicsRepository.createQueryBuilder('characteristic');

    if (query.name) {
      queryBuilder.andWhere('characteristic.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.level !== undefined) {
      queryBuilder.andWhere('characteristic.level = :level', {
        level: query.level,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'characteristic_tags',
          'characteristic_tag_filter',
          'characteristic_tag_filter.characteristic_id = characteristic.id AND characteristic_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('characteristic.id')
        .having(
          'COUNT(DISTINCT characteristic_tag_filter.tag_id) = :tagCount',
          { tagCount: uniqueTagIds.length },
        );
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por característica). Sem filtro de tags, `getCount()` é suficiente
    // e evita trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (
          await queryBuilder.clone().select('characteristic.id').getRawMany()
        ).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['characteristic.id', 'characteristic.name'])
      .orderBy('characteristic.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const characteristics = await this.characteristicsRepository.find({
      where: { id: In(ids.map((characteristic) => characteristic.id)) },
      order: { name: 'ASC' },
    });

    const tagsByCharacteristicId = await loadOrderedTagsMap(
      this.characteristicTagsRepository,
      characteristics.map((characteristic) => characteristic.id),
      'characteristic',
    );
    for (const characteristic of characteristics) {
      characteristic.tags = tagsByCharacteristicId.get(characteristic.id) ?? [];
    }

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
    const characteristic = await this.characteristicsRepository.findOneBy({
      id,
    });
    if (!characteristic) {
      throw new NotFoundException('Característica não encontrada.');
    }
    characteristic.tags = await loadOrderedTagsForOwner(
      this.characteristicTagsRepository,
      id,
      'characteristic',
    );

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
    let tags = characteristic.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.characteristicTagsRepository,
        'characteristic',
        characteristic,
        tags,
      );
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
      ownerEntityType: ReferenceableEntityType.CHARACTERISTIC,
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
        ImprovementFlawOwnerType.CHARACTERISTIC,
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

    let effectiveProficiencies = dto.proficiencies;
    if (effectiveProficiencies === undefined) {
      const currentProficiencies = await this.proficienciesService.loadItemsFor(
        ProficiencyOwnerType.CHARACTERISTIC,
        id,
      );
      effectiveProficiencies = currentProficiencies.map(
        (item): ProficiencyItemInputDto => ({
          property: item.property.id,
          gradation: item.gradation.id,
        }),
      );
    }

    const resolvedProficiencies =
      await this.proficienciesService.validateAndResolveItems(
        effectiveProficiencies,
      );
    this.proficienciesService.validateList(effectiveProficiencies);

    let effectiveKnowledges = dto.knowledges;
    if (effectiveKnowledges === undefined) {
      const currentKnowledges = await this.knowledgesService.loadItemsFor(
        KnowledgeOwnerType.CHARACTERISTIC,
        id,
      );
      effectiveKnowledges = currentKnowledges.map(
        (item): KnowledgeItemInputDto => ({
          title: item.title,
          gradation: item.gradation.id,
          editable: item.editable,
        }),
      );
    }

    const resolvedKnowledges =
      await this.knowledgesService.validateAndResolveItems(effectiveKnowledges);
    this.knowledgesService.validateList(effectiveKnowledges);

    const savedCharacteristic =
      await this.characteristicsRepository.save(characteristic);
    savedCharacteristic.tags = tags;

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
    if (dto.additionalAbilities !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.CHARACTERISTIC,
        id,
        EntityLinkType.ADDITIONAL_ABILITY,
        dto.additionalAbilities,
      );
    }
    if (dto.improvements !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.CHARACTERISTIC,
        id,
        ImprovementFlawCategory.IMPROVEMENT,
        dto.improvements,
        resolvedImprovements,
      );
    }
    if (dto.flaws !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.CHARACTERISTIC,
        id,
        ImprovementFlawCategory.FLAW,
        dto.flaws,
        resolvedFlaws,
      );
    }
    if (dto.proficiencies !== undefined) {
      await this.proficienciesService.replaceItems(
        ProficiencyOwnerType.CHARACTERISTIC,
        id,
        dto.proficiencies,
        resolvedProficiencies,
      );
    }
    if (dto.knowledges !== undefined) {
      await this.knowledgesService.replaceItems(
        KnowledgeOwnerType.CHARACTERISTIC,
        id,
        dto.knowledges,
        resolvedKnowledges,
      );
    }

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.CHARACTERISTIC,
        id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.CHARACTERISTIC,
        id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.CHARACTERISTIC,
      id,
    );
    const knowledges = await this.knowledgesService.loadItemsFor(
      KnowledgeOwnerType.CHARACTERISTIC,
      id,
    );

    return {
      characteristic: savedCharacteristic,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    };
  }

  async remove(id: string): Promise<void> {
    const result = await this.characteristicsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Característica não encontrada.');
    }
  }
}
