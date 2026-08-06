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
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { FindTrainingsQueryDto } from './dto/find-trainings-query.dto';
import { Training } from './entities/training.entity';
import { TrainingTag } from './entities/training-tag.entity';
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
  additionalAbilities: EntityReferenceResponseDto[];
  improvements: ImprovementFlawItemResponseDto[];
  flaws: ImprovementFlawItemResponseDto[];
  proficiencies: ProficiencyItemResponseDto[];
  knowledges: KnowledgeItemResponseDto[];
}

@Injectable()
export class TrainingsService {
  constructor(
    @InjectRepository(Training)
    private readonly trainingsRepository: Repository<Training>,
    @InjectRepository(TrainingTag)
    private readonly trainingTagsRepository: Repository<TrainingTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
    private readonly improvementFlawsService: ImprovementFlawsService,
    private readonly proficienciesService: ProficienciesService,
    private readonly knowledgesService: KnowledgesService,
  ) {}

  findByName(name: string): Promise<Training | null> {
    return this.trainingsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<TrainingWithReferences | null> {
    const training = await this.trainingsRepository.findOneBy({ id });
    if (!training) {
      return null;
    }
    training.tags = await loadOrderedTagsForOwner(
      this.trainingTagsRepository,
      id,
      'training',
    );

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TRAINING,
        id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.TRAINING,
        id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.TRAINING,
      id,
    );
    const knowledges = await this.knowledgesService.loadItemsFor(
      KnowledgeOwnerType.TRAINING,
      id,
    );

    return {
      training,
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
    const additionalAbilitiesInput = dto.additionalAbilities ?? [];
    const improvementsInput = dto.improvements ?? [];
    const flawsInput = dto.flaws ?? [];
    const proficienciesInput = dto.proficiencies ?? [];
    const knowledgesInput = dto.knowledges ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.TRAINING,
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

    const training = this.trainingsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
    });

    const savedTraining = await this.trainingsRepository.save(training);
    await createOrderedTagJunctions(
      this.trainingTagsRepository,
      'training',
      savedTraining,
      tags,
    );
    savedTraining.tags = tags;

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
    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.TRAINING,
      savedTraining.id,
      EntityLinkType.ADDITIONAL_ABILITY,
      additionalAbilitiesInput,
    );

    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.TRAINING,
      savedTraining.id,
      ImprovementFlawCategory.IMPROVEMENT,
      improvementsInput,
      resolvedImprovements,
    );
    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.TRAINING,
      savedTraining.id,
      ImprovementFlawCategory.FLAW,
      flawsInput,
      resolvedFlaws,
    );
    await this.proficienciesService.replaceItems(
      ProficiencyOwnerType.TRAINING,
      savedTraining.id,
      proficienciesInput,
      resolvedProficiencies,
    );
    await this.knowledgesService.replaceItems(
      KnowledgeOwnerType.TRAINING,
      savedTraining.id,
      knowledgesInput,
      resolvedKnowledges,
    );

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TRAINING,
        savedTraining.id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.TRAINING,
        savedTraining.id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.TRAINING,
      savedTraining.id,
    );
    const knowledges = await this.knowledgesService.loadItemsFor(
      KnowledgeOwnerType.TRAINING,
      savedTraining.id,
    );

    return {
      training: savedTraining,
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
      order: { name: 'ASC' },
    });

    const tagsByTrainingId = await loadOrderedTagsMap(
      this.trainingTagsRepository,
      trainings.map((training) => training.id),
      'training',
    );
    for (const training of trainings) {
      training.tags = tagsByTrainingId.get(training.id) ?? [];
    }

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
    const training = await this.trainingsRepository.findOneBy({ id });
    if (!training) {
      throw new NotFoundException('Treinamento não encontrado.');
    }
    training.tags = await loadOrderedTagsForOwner(
      this.trainingTagsRepository,
      id,
      'training',
    );

    if (dto.name && dto.name !== training.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um treinamento com este nome.');
      }
      training.name = dto.name;
    }

    if (dto.description !== undefined) {
      training.description = dto.description;
    }
    let tags = training.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.trainingTagsRepository,
        'training',
        training,
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
      ownerEntityType: ReferenceableEntityType.TRAINING,
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
        ImprovementFlawOwnerType.TRAINING,
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
        ProficiencyOwnerType.TRAINING,
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
        KnowledgeOwnerType.TRAINING,
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
      await this.knowledgesService.validateAndResolveItems(
        effectiveKnowledges,
      );
    this.knowledgesService.validateList(effectiveKnowledges);

    const savedTraining = await this.trainingsRepository.save(training);
    savedTraining.tags = tags;

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
    if (dto.additionalAbilities !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.TRAINING,
        id,
        EntityLinkType.ADDITIONAL_ABILITY,
        dto.additionalAbilities,
      );
    }
    if (dto.improvements !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.TRAINING,
        id,
        ImprovementFlawCategory.IMPROVEMENT,
        dto.improvements,
        resolvedImprovements,
      );
    }
    if (dto.flaws !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.TRAINING,
        id,
        ImprovementFlawCategory.FLAW,
        dto.flaws,
        resolvedFlaws,
      );
    }
    if (dto.proficiencies !== undefined) {
      await this.proficienciesService.replaceItems(
        ProficiencyOwnerType.TRAINING,
        id,
        dto.proficiencies,
        resolvedProficiencies,
      );
    }
    if (dto.knowledges !== undefined) {
      await this.knowledgesService.replaceItems(
        KnowledgeOwnerType.TRAINING,
        id,
        dto.knowledges,
        resolvedKnowledges,
      );
    }

    const { improvedFrom, requirements, additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.TRAINING,
        id,
      );
    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.TRAINING,
        id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.TRAINING,
      id,
    );
    const knowledges = await this.knowledgesService.loadItemsFor(
      KnowledgeOwnerType.TRAINING,
      id,
    );

    return {
      training: savedTraining,
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
    const result = await this.trainingsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Treinamento não encontrado.');
    }
  }
}
