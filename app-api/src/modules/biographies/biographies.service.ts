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
import { CreateBiographyDto } from './dto/create-biography.dto';
import { UpdateBiographyDto } from './dto/update-biography.dto';
import { FindBiographiesQueryDto } from './dto/find-biographies-query.dto';
import { Biography } from './entities/biography.entity';
import { BiographyTag } from './entities/biography-tag.entity';
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

export interface PaginatedBiographies {
  data: Biography[];
  total: number;
  page: number;
  perPage: number;
}

export interface BiographyWithReferences {
  biography: Biography;
  additionalAbilities: EntityReferenceResponseDto[];
  improvements: ImprovementFlawItemResponseDto[];
  proficiencies: ProficiencyItemResponseDto[];
}

@Injectable()
export class BiographiesService {
  constructor(
    @InjectRepository(Biography)
    private readonly biographiesRepository: Repository<Biography>,
    @InjectRepository(BiographyTag)
    private readonly biographyTagsRepository: Repository<BiographyTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
    private readonly improvementFlawsService: ImprovementFlawsService,
    private readonly proficienciesService: ProficienciesService,
  ) {}

  findByName(name: string): Promise<Biography | null> {
    return this.biographiesRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<BiographyWithReferences | null> {
    const biography = await this.biographiesRepository.findOneBy({ id });
    if (!biography) {
      return null;
    }
    biography.tags = await loadOrderedTagsForOwner(
      this.biographyTagsRepository,
      id,
      'biography',
    );

    const { additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.BIOGRAPHY,
        id,
      );
    const { improvements } = await this.improvementFlawsService.loadItemsFor(
      ImprovementFlawOwnerType.BIOGRAPHY,
      id,
    );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.BIOGRAPHY,
      id,
    );

    return { biography, additionalAbilities, improvements, proficiencies };
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

  async create(dto: CreateBiographyDto): Promise<BiographyWithReferences> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma biografia com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const additionalAbilitiesInput = dto.additionalAbilities ?? [];
    const improvementsInput = dto.improvements ?? [];
    const proficienciesInput = dto.proficiencies ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.BIOGRAPHY,
      improvedFrom: [],
      requirements: [],
      additionalAbilities: additionalAbilitiesInput,
    });

    await this.entityLinksService.resolveReferences(additionalAbilitiesInput);

    const resolvedImprovements =
      await this.improvementFlawsService.validateAndResolveItems(
        improvementsInput,
      );
    this.improvementFlawsService.validateLists({
      improvements: improvementsInput,
      flaws: [],
    });

    const resolvedProficiencies =
      await this.proficienciesService.validateAndResolveItems(
        proficienciesInput,
      );
    this.proficienciesService.validateList(proficienciesInput);

    const biography = this.biographiesRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      imageReference: dto.imageReference ?? null,
    });

    const savedBiography = await this.biographiesRepository.save(biography);
    await createOrderedTagJunctions(
      this.biographyTagsRepository,
      'biography',
      savedBiography,
      tags,
    );
    savedBiography.tags = tags;

    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.BIOGRAPHY,
      savedBiography.id,
      EntityLinkType.ADDITIONAL_ABILITY,
      additionalAbilitiesInput,
    );

    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.BIOGRAPHY,
      savedBiography.id,
      ImprovementFlawCategory.IMPROVEMENT,
      improvementsInput,
      resolvedImprovements,
    );
    await this.proficienciesService.replaceItems(
      ProficiencyOwnerType.BIOGRAPHY,
      savedBiography.id,
      proficienciesInput,
      resolvedProficiencies,
    );

    const { additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.BIOGRAPHY,
        savedBiography.id,
      );
    const { improvements } = await this.improvementFlawsService.loadItemsFor(
      ImprovementFlawOwnerType.BIOGRAPHY,
      savedBiography.id,
    );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.BIOGRAPHY,
      savedBiography.id,
    );

    return {
      biography: savedBiography,
      additionalAbilities,
      improvements,
      proficiencies,
    };
  }

  async findAllPaginated(
    query: FindBiographiesQueryDto,
  ): Promise<PaginatedBiographies> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.biographiesRepository.createQueryBuilder('biography');

    if (query.name) {
      queryBuilder.andWhere('biography.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['biography.id', 'biography.name'])
      .orderBy('biography.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const biographies = await this.biographiesRepository.find({
      where: { id: In(ids.map((biography) => biography.id)) },
      order: { name: 'ASC' },
    });

    const tagsByBiographyId = await loadOrderedTagsMap(
      this.biographyTagsRepository,
      biographies.map((biography) => biography.id),
      'biography',
    );
    for (const biography of biographies) {
      biography.tags = tagsByBiographyId.get(biography.id) ?? [];
    }

    const biographiesById = new Map(
      biographies.map((biography) => [biography.id, biography]),
    );
    const data = ids
      .map((biography) => biographiesById.get(biography.id))
      .filter((biography): biography is Biography => biography !== undefined);

    return { data, total, page, perPage };
  }

  async update(
    id: string,
    dto: UpdateBiographyDto,
  ): Promise<BiographyWithReferences> {
    const biography = await this.biographiesRepository.findOneBy({ id });
    if (!biography) {
      throw new NotFoundException('Biografia não encontrada.');
    }
    biography.tags = await loadOrderedTagsForOwner(
      this.biographyTagsRepository,
      id,
      'biography',
    );

    if (dto.name && dto.name !== biography.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma biografia com este nome.');
      }
      biography.name = dto.name;
    }

    if (dto.description !== undefined) {
      biography.description = dto.description;
    }
    if (dto.imageReference !== undefined) {
      biography.imageReference = dto.imageReference;
    }
    let tags = biography.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.biographyTagsRepository,
        'biography',
        biography,
        tags,
      );
    }

    let effectiveAdditionalAbilities = dto.additionalAbilities;
    if (effectiveAdditionalAbilities === undefined) {
      const current = await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.BIOGRAPHY,
        id,
      );
      effectiveAdditionalAbilities = current.additionalAbilities.map(
        (ref): EntityReferenceInputDto => ({
          entityType: ref.entityType,
          id: ref.id,
        }),
      );
    }

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.BIOGRAPHY,
      ownerId: id,
      improvedFrom: [],
      requirements: [],
      additionalAbilities: effectiveAdditionalAbilities,
    });

    if (dto.additionalAbilities !== undefined) {
      await this.entityLinksService.resolveReferences(dto.additionalAbilities);
    }

    let effectiveImprovements = dto.improvements;
    if (effectiveImprovements === undefined) {
      const currentItems = await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.BIOGRAPHY,
        id,
      );
      effectiveImprovements = currentItems.improvements.map(
        (item): ImprovementFlawItemInputDto => ({
          value: item.value,
          type: item.type.id,
          property: item.property.id,
        }),
      );
    }

    const resolvedImprovements =
      await this.improvementFlawsService.validateAndResolveItems(
        effectiveImprovements,
      );
    this.improvementFlawsService.validateLists({
      improvements: effectiveImprovements,
      flaws: [],
    });

    let effectiveProficiencies = dto.proficiencies;
    if (effectiveProficiencies === undefined) {
      const currentProficiencies = await this.proficienciesService.loadItemsFor(
        ProficiencyOwnerType.BIOGRAPHY,
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

    const savedBiography = await this.biographiesRepository.save(biography);
    savedBiography.tags = tags;

    if (dto.additionalAbilities !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.BIOGRAPHY,
        id,
        EntityLinkType.ADDITIONAL_ABILITY,
        dto.additionalAbilities,
      );
    }
    if (dto.improvements !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.BIOGRAPHY,
        id,
        ImprovementFlawCategory.IMPROVEMENT,
        dto.improvements,
        resolvedImprovements,
      );
    }
    if (dto.proficiencies !== undefined) {
      await this.proficienciesService.replaceItems(
        ProficiencyOwnerType.BIOGRAPHY,
        id,
        dto.proficiencies,
        resolvedProficiencies,
      );
    }

    const { additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.BIOGRAPHY,
        id,
      );
    const { improvements } = await this.improvementFlawsService.loadItemsFor(
      ImprovementFlawOwnerType.BIOGRAPHY,
      id,
    );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.BIOGRAPHY,
      id,
    );

    return {
      biography: savedBiography,
      additionalAbilities,
      improvements,
      proficiencies,
    };
  }

  async remove(id: string): Promise<void> {
    const result = await this.biographiesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Biografia não encontrada.');
    }
  }
}
