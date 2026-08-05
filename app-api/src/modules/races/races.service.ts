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
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import { FindRacesQueryDto } from './dto/find-races-query.dto';
import { Race } from './entities/race.entity';
import { RaceTag } from './entities/race-tag.entity';
import { RaceCategory } from './entities/race-category.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Characteristic } from '../characteristics/entities/characteristic.entity';
import { CharacteristicTag } from '../characteristics/entities/characteristic-tag.entity';
import { Talent } from '../talents/entities/talent.entity';
import { TalentTag } from '../talents/entities/talent-tag.entity';
import { ImprovementFlawsService } from '../improvement-flaws/improvement-flaws.service';
import { ImprovementFlawOwnerType } from '../improvement-flaws/enums/improvement-flaw-owner-type.enum';
import { ImprovementFlawCategory } from '../improvement-flaws/enums/improvement-flaw-category.enum';
import { ImprovementFlawItemInputDto } from '../improvement-flaws/dto/improvement-flaw-item-input.dto';
import { ImprovementFlawItemResponseDto } from '../improvement-flaws/dto/improvement-flaw-item-response.dto';
import { ProficienciesService } from '../proficiencies/proficiencies.service';
import { ProficiencyOwnerType } from '../proficiencies/enums/proficiency-owner-type.enum';
import { ProficiencyItemInputDto } from '../proficiencies/dto/proficiency-item-input.dto';
import { ProficiencyItemResponseDto } from '../proficiencies/dto/proficiency-item-response.dto';

export interface PaginatedRaces {
  data: Race[];
  total: number;
  page: number;
  perPage: number;
}

export interface RaceWithReferences {
  race: Race;
  improvements: ImprovementFlawItemResponseDto[];
  flaws: ImprovementFlawItemResponseDto[];
  proficiencies: ProficiencyItemResponseDto[];
}

@Injectable()
export class RacesService {
  constructor(
    @InjectRepository(Race)
    private readonly racesRepository: Repository<Race>,
    @InjectRepository(RaceCategory)
    private readonly raceCategoriesRepository: Repository<RaceCategory>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(RaceTag)
    private readonly raceTagsRepository: Repository<RaceTag>,
    @InjectRepository(Characteristic)
    private readonly characteristicsRepository: Repository<Characteristic>,
    @InjectRepository(CharacteristicTag)
    private readonly characteristicTagsRepository: Repository<CharacteristicTag>,
    @InjectRepository(Talent)
    private readonly talentsRepository: Repository<Talent>,
    @InjectRepository(TalentTag)
    private readonly talentTagsRepository: Repository<TalentTag>,
    private readonly improvementFlawsService: ImprovementFlawsService,
    private readonly proficienciesService: ProficienciesService,
  ) {}

  findByName(name: string): Promise<Race | null> {
    return this.racesRepository.findOneBy({ name });
  }

  private async attachOrderedTags(race: Race): Promise<void> {
    race.tags = await loadOrderedTagsForOwner(
      this.raceTagsRepository,
      race.id,
      'race',
    );

    const characteristicTagsById = await loadOrderedTagsMap(
      this.characteristicTagsRepository,
      race.characteristics.map((characteristic) => characteristic.id),
      'characteristic',
    );
    for (const characteristic of race.characteristics) {
      characteristic.tags =
        characteristicTagsById.get(characteristic.id) ?? [];
    }

    const talentTagsById = await loadOrderedTagsMap(
      this.talentTagsRepository,
      race.talents.map((talent) => talent.id),
      'talent',
    );
    for (const talent of race.talents) {
      talent.tags = talentTagsById.get(talent.id) ?? [];
    }
  }

  async findById(id: string): Promise<RaceWithReferences | null> {
    const race = await this.racesRepository.findOne({
      where: { id },
      relations: {
        category: true,
        characteristics: true,
        talents: true,
      },
    });
    if (!race) {
      return null;
    }
    await this.attachOrderedTags(race);

    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.RACE,
        id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.RACE,
      id,
    );

    return { race, improvements, flaws, proficiencies };
  }

  findCategoryById(id: string): Promise<RaceCategory | null> {
    return this.raceCategoriesRepository.findOneBy({ id });
  }

  findAllCategories(): Promise<RaceCategory[]> {
    return this.raceCategoriesRepository.find({
      order: { name: 'ASC' },
    });
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

  private async findCharacteristicsByIds(
    characteristicIds: string[],
  ): Promise<Characteristic[]> {
    const uniqueIds = [...new Set(characteristicIds)];
    const characteristics = await this.characteristicsRepository.findBy({
      id: In(uniqueIds),
    });
    if (characteristics.length !== uniqueIds.length) {
      const foundIds = new Set(characteristics.map((c) => c.id));
      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `As seguintes características não foram encontradas: ${missingIds.join(', ')}.`,
      );
    }
    return characteristics;
  }

  private async findTalentsByIds(talentIds: string[]): Promise<Talent[]> {
    const uniqueIds = [...new Set(talentIds)];
    const talents = await this.talentsRepository.findBy({ id: In(uniqueIds) });
    if (talents.length !== uniqueIds.length) {
      const foundIds = new Set(talents.map((t) => t.id));
      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Os seguintes talentos não foram encontrados: ${missingIds.join(', ')}.`,
      );
    }
    return talents;
  }

  async create(dto: CreateRaceDto): Promise<RaceWithReferences> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma raça com este nome.');
    }

    const category = await this.findCategoryById(dto.categoryId);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const characteristics =
      dto.characteristicIds && dto.characteristicIds.length > 0
        ? await this.findCharacteristicsByIds(dto.characteristicIds)
        : [];

    const talents =
      dto.talentIds && dto.talentIds.length > 0
        ? await this.findTalentsByIds(dto.talentIds)
        : [];

    const improvementsInput = dto.improvements ?? [];
    const flawsInput = dto.flaws ?? [];
    const proficienciesInput = dto.proficiencies ?? [];

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

    const race = this.racesRepository.create({
      name: dto.name,
      category,
      referenceImageUrl: dto.referenceImageUrl ?? null,
      description: dto.description ?? null,
      privateInformation: dto.privateInformation ?? null,
      characteristics,
      talents,
    });

    const savedRace = await this.racesRepository.save(race);
    await createOrderedTagJunctions(
      this.raceTagsRepository,
      'race',
      savedRace,
      tags,
    );
    savedRace.tags = tags;

    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.RACE,
      savedRace.id,
      ImprovementFlawCategory.IMPROVEMENT,
      improvementsInput,
      resolvedImprovements,
    );
    await this.improvementFlawsService.replaceItems(
      ImprovementFlawOwnerType.RACE,
      savedRace.id,
      ImprovementFlawCategory.FLAW,
      flawsInput,
      resolvedFlaws,
    );
    await this.proficienciesService.replaceItems(
      ProficiencyOwnerType.RACE,
      savedRace.id,
      proficienciesInput,
      resolvedProficiencies,
    );

    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.RACE,
        savedRace.id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.RACE,
      savedRace.id,
    );

    return { race: savedRace, improvements, flaws, proficiencies };
  }

  async findAllPaginated(query: FindRacesQueryDto): Promise<PaginatedRaces> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.racesRepository
      .createQueryBuilder('race')
      .leftJoin('race.category', 'category');

    if (query.name) {
      queryBuilder.andWhere('race.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('race.category = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['race.id', 'race.name'])
      .orderBy('race.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const races = await this.racesRepository.find({
      where: { id: In(ids.map((race) => race.id)) },
      relations: { category: true },
    });

    const tagsByRaceId = await loadOrderedTagsMap(
      this.raceTagsRepository,
      races.map((race) => race.id),
      'race',
    );
    for (const race of races) {
      race.tags = tagsByRaceId.get(race.id) ?? [];
    }

    const racesById = new Map(races.map((race) => [race.id, race]));
    const data = ids
      .map((race) => racesById.get(race.id))
      .filter((race): race is Race => race !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateRaceDto): Promise<RaceWithReferences> {
    const result = await this.findById(id);
    if (!result) {
      throw new NotFoundException('Raça não encontrada.');
    }
    const { race } = result;

    if (dto.name && dto.name !== race.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma raça com este nome.');
      }
      race.name = dto.name;
    }

    if (dto.categoryId && dto.categoryId !== race.category.id) {
      const category = await this.findCategoryById(dto.categoryId);
      if (!category) {
        throw new NotFoundException('Categoria não encontrada.');
      }
      race.category = category;
    }

    if (dto.referenceImageUrl !== undefined) {
      race.referenceImageUrl = dto.referenceImageUrl;
    }
    if (dto.description !== undefined) {
      race.description = dto.description;
    }
    if (dto.privateInformation !== undefined) {
      race.privateInformation = dto.privateInformation;
    }
    let tags = race.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.raceTagsRepository,
        'race',
        race,
        tags,
      );
    }
    if (dto.characteristicIds !== undefined) {
      race.characteristics =
        dto.characteristicIds.length > 0
          ? await this.findCharacteristicsByIds(dto.characteristicIds)
          : [];
    }
    if (dto.talentIds !== undefined) {
      race.talents =
        dto.talentIds.length > 0
          ? await this.findTalentsByIds(dto.talentIds)
          : [];
    }

    let effectiveImprovements = dto.improvements;
    let effectiveFlaws = dto.flaws;

    if (effectiveImprovements === undefined || effectiveFlaws === undefined) {
      const currentItems = await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.RACE,
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
        ProficiencyOwnerType.RACE,
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

    const savedRace = await this.racesRepository.save(race);
    await this.attachOrderedTags(savedRace);

    if (dto.improvements !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.RACE,
        id,
        ImprovementFlawCategory.IMPROVEMENT,
        dto.improvements,
        resolvedImprovements,
      );
    }
    if (dto.flaws !== undefined) {
      await this.improvementFlawsService.replaceItems(
        ImprovementFlawOwnerType.RACE,
        id,
        ImprovementFlawCategory.FLAW,
        dto.flaws,
        resolvedFlaws,
      );
    }
    if (dto.proficiencies !== undefined) {
      await this.proficienciesService.replaceItems(
        ProficiencyOwnerType.RACE,
        id,
        dto.proficiencies,
        resolvedProficiencies,
      );
    }

    const { improvements, flaws } =
      await this.improvementFlawsService.loadItemsFor(
        ImprovementFlawOwnerType.RACE,
        id,
      );
    const proficiencies = await this.proficienciesService.loadItemsFor(
      ProficiencyOwnerType.RACE,
      id,
    );

    return { race: savedRace, improvements, flaws, proficiencies };
  }

  async remove(id: string): Promise<void> {
    const result = await this.racesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Raça não encontrada.');
    }
  }
}
