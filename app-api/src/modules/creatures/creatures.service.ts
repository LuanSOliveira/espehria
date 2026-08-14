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
import { CreateCreatureDto } from './dto/create-creature.dto';
import { UpdateCreatureDto } from './dto/update-creature.dto';
import { FindCreaturesQueryDto } from './dto/find-creatures-query.dto';
import { Creature } from './entities/creature.entity';
import { CreatureTag } from './entities/creature-tag.entity';
import { CreatureCategory } from './entities/creature-category.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedCreatures {
  data: Creature[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class CreaturesService {
  constructor(
    @InjectRepository(Creature)
    private readonly creaturesRepository: Repository<Creature>,
    @InjectRepository(CreatureCategory)
    private readonly creatureCategoriesRepository: Repository<CreatureCategory>,
    @InjectRepository(CreatureTag)
    private readonly creatureTagsRepository: Repository<CreatureTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Creature | null> {
    return this.creaturesRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Creature | null> {
    const creature = await this.creaturesRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!creature) {
      return null;
    }
    creature.tags = await loadOrderedTagsForOwner(
      this.creatureTagsRepository,
      id,
      'creature',
    );
    return creature;
  }

  findCategoryById(id: string): Promise<CreatureCategory | null> {
    return this.creatureCategoriesRepository.findOneBy({ id });
  }

  findAllCategories(): Promise<CreatureCategory[]> {
    return this.creatureCategoriesRepository.find({
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

  async create(dto: CreateCreatureDto): Promise<Creature> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma criatura com este nome.');
    }

    const category = await this.findCategoryById(dto.categoryId);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const creature = this.creaturesRepository.create({
      name: dto.name,
      category,
      referenceImageUrl: dto.referenceImageUrl ?? null,
      otherNames: dto.otherNames ?? null,
      threatLevel: dto.threatLevel ?? null,
      averageLifeExpectancy: dto.averageLifeExpectancy ?? null,
      physicalCharacteristics: dto.physicalCharacteristics,
      habitat: dto.habitat ?? null,
      behavior: dto.behavior ?? null,
      diet: dto.diet ?? null,
      lifeCycle: dto.lifeCycle ?? null,
      lifeStageInfant: dto.lifeStageInfant ?? null,
      lifeStageYoung: dto.lifeStageYoung ?? null,
      lifeStageAdult: dto.lifeStageAdult ?? null,
      lifeStageElder: dto.lifeStageElder ?? null,
      abilitiesAndPowers: dto.abilitiesAndPowers ?? null,
      resistances: dto.resistances ?? null,
      weaknesses: dto.weaknesses ?? null,
      combat: dto.combat ?? null,
      attackMethods: dto.attackMethods ?? null,
      strategy: dto.strategy ?? null,
      dangerDegree: dto.dangerDegree ?? null,
      obtainedResources: dto.obtainedResources ?? null,
      commercialValue: dto.commercialValue ?? null,
      relationWithCivilizations: dto.relationWithCivilizations ?? null,
      mythologyAndFolklore: dto.mythologyAndFolklore ?? null,
      encounterRecord: dto.encounterRecord ?? null,
      scholarsCuriosity: dto.scholarsCuriosity ?? null,
      privateInformation: dto.privateInformation ?? null,
    });

    const savedCreature = await this.creaturesRepository.save(creature);
    await createOrderedTagJunctions(
      this.creatureTagsRepository,
      'creature',
      savedCreature,
      tags,
    );
    savedCreature.tags = tags;
    return savedCreature;
  }

  async findAllPaginated(
    query: FindCreaturesQueryDto,
  ): Promise<PaginatedCreatures> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.creaturesRepository
      .createQueryBuilder('creature')
      .leftJoin('creature.category', 'category');

    if (query.name) {
      queryBuilder.andWhere('creature.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('creature.category = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'creature_tags',
          'creature_tag_filter',
          'creature_tag_filter.creature_id = creature.id AND creature_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('creature.id')
        .having('COUNT(DISTINCT creature_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por criatura). Sem filtro de tags, `getCount()` é suficiente e
    // evita trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('creature.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['creature.id', 'creature.name'])
      .orderBy('creature.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const creatures = await this.creaturesRepository.find({
      where: { id: In(ids.map((creature) => creature.id)) },
      relations: { category: true },
    });

    const tagsByCreatureId = await loadOrderedTagsMap(
      this.creatureTagsRepository,
      creatures.map((creature) => creature.id),
      'creature',
    );
    for (const creature of creatures) {
      creature.tags = tagsByCreatureId.get(creature.id) ?? [];
    }

    const creaturesById = new Map(
      creatures.map((creature) => [creature.id, creature]),
    );
    const data = ids
      .map((creature) => creaturesById.get(creature.id))
      .filter((creature): creature is Creature => creature !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateCreatureDto): Promise<Creature> {
    const creature = await this.findById(id);
    if (!creature) {
      throw new NotFoundException('Criatura não encontrada.');
    }

    if (dto.name && dto.name !== creature.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma criatura com este nome.');
      }
      creature.name = dto.name;
    }

    if (dto.categoryId && dto.categoryId !== creature.category.id) {
      const category = await this.findCategoryById(dto.categoryId);
      if (!category) {
        throw new NotFoundException('Categoria não encontrada.');
      }
      creature.category = category;
    }

    if (dto.referenceImageUrl !== undefined) {
      creature.referenceImageUrl = dto.referenceImageUrl;
    }
    if (dto.otherNames !== undefined) {
      creature.otherNames = dto.otherNames;
    }
    if (dto.threatLevel !== undefined) {
      creature.threatLevel = dto.threatLevel;
    }
    if (dto.averageLifeExpectancy !== undefined) {
      creature.averageLifeExpectancy = dto.averageLifeExpectancy;
    }
    if (dto.physicalCharacteristics !== undefined) {
      creature.physicalCharacteristics = dto.physicalCharacteristics;
    }
    if (dto.habitat !== undefined) {
      creature.habitat = dto.habitat;
    }
    if (dto.behavior !== undefined) {
      creature.behavior = dto.behavior;
    }
    if (dto.diet !== undefined) {
      creature.diet = dto.diet;
    }
    if (dto.lifeCycle !== undefined) {
      creature.lifeCycle = dto.lifeCycle;
    }
    if (dto.lifeStageInfant !== undefined) {
      creature.lifeStageInfant = dto.lifeStageInfant;
    }
    if (dto.lifeStageYoung !== undefined) {
      creature.lifeStageYoung = dto.lifeStageYoung;
    }
    if (dto.lifeStageAdult !== undefined) {
      creature.lifeStageAdult = dto.lifeStageAdult;
    }
    if (dto.lifeStageElder !== undefined) {
      creature.lifeStageElder = dto.lifeStageElder;
    }
    if (dto.abilitiesAndPowers !== undefined) {
      creature.abilitiesAndPowers = dto.abilitiesAndPowers;
    }
    if (dto.resistances !== undefined) {
      creature.resistances = dto.resistances;
    }
    if (dto.weaknesses !== undefined) {
      creature.weaknesses = dto.weaknesses;
    }
    if (dto.combat !== undefined) {
      creature.combat = dto.combat;
    }
    if (dto.attackMethods !== undefined) {
      creature.attackMethods = dto.attackMethods;
    }
    if (dto.strategy !== undefined) {
      creature.strategy = dto.strategy;
    }
    if (dto.dangerDegree !== undefined) {
      creature.dangerDegree = dto.dangerDegree;
    }
    if (dto.obtainedResources !== undefined) {
      creature.obtainedResources = dto.obtainedResources;
    }
    if (dto.commercialValue !== undefined) {
      creature.commercialValue = dto.commercialValue;
    }
    if (dto.relationWithCivilizations !== undefined) {
      creature.relationWithCivilizations = dto.relationWithCivilizations;
    }
    if (dto.mythologyAndFolklore !== undefined) {
      creature.mythologyAndFolklore = dto.mythologyAndFolklore;
    }
    if (dto.encounterRecord !== undefined) {
      creature.encounterRecord = dto.encounterRecord;
    }
    if (dto.scholarsCuriosity !== undefined) {
      creature.scholarsCuriosity = dto.scholarsCuriosity;
    }
    if (dto.privateInformation !== undefined) {
      creature.privateInformation = dto.privateInformation;
    }
    let tags = creature.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.creatureTagsRepository,
        'creature',
        creature,
        tags,
      );
    }

    const savedCreature = await this.creaturesRepository.save(creature);
    savedCreature.tags = tags;
    return savedCreature;
  }

  async remove(id: string): Promise<void> {
    const result = await this.creaturesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Criatura não encontrada.');
    }
  }
}
