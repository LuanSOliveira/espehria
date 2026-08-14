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
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { FindConditionsQueryDto } from './dto/find-conditions-query.dto';
import { ConditionSectionInputDto } from './dto/condition-section-input.dto';
import { Condition } from './entities/condition.entity';
import { ConditionSection } from './entities/condition-section.entity';
import { ConditionTag } from './entities/condition-tag.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedConditions {
  data: Condition[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class ConditionsService {
  constructor(
    @InjectRepository(Condition)
    private readonly conditionsRepository: Repository<Condition>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(ConditionSection)
    private readonly conditionSectionsRepository: Repository<ConditionSection>,
    @InjectRepository(ConditionTag)
    private readonly conditionTagsRepository: Repository<ConditionTag>,
  ) {}

  findByName(name: string): Promise<Condition | null> {
    return this.conditionsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Condition | null> {
    const condition = await this.conditionsRepository.findOne({
      where: { id },
      relations: { sections: true },
    });
    if (!condition) {
      return null;
    }
    condition.tags = await loadOrderedTagsForOwner(
      this.conditionTagsRepository,
      id,
      'condition',
    );
    return condition;
  }

  private buildSections(
    sections: ConditionSectionInputDto[],
  ): ConditionSection[] {
    return sections.map((section, index) =>
      this.conditionSectionsRepository.create({
        label: section.label,
        description: section.description ?? null,
        order: index,
      }),
    );
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

  async create(dto: CreateConditionDto): Promise<Condition> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma condição com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const sections =
      dto.sections && dto.sections.length > 0
        ? this.buildSections(dto.sections)
        : [];

    const condition = this.conditionsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      sections,
    });

    const savedCondition = await this.conditionsRepository.save(condition);
    await createOrderedTagJunctions(
      this.conditionTagsRepository,
      'condition',
      savedCondition,
      tags,
    );
    savedCondition.tags = tags;
    return savedCondition;
  }

  async findAllPaginated(
    query: FindConditionsQueryDto,
  ): Promise<PaginatedConditions> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.conditionsRepository.createQueryBuilder('condition');

    if (query.name) {
      queryBuilder.andWhere('condition.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'condition_tags',
          'condition_tag_filter',
          'condition_tag_filter.condition_id = condition.id AND condition_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('condition.id')
        .having('COUNT(DISTINCT condition_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por condição). Sem filtro de tags, `getCount()` é suficiente e
    // evita trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('condition.id').getRawMany())
          .length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['condition.id', 'condition.name'])
      .orderBy('condition.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const conditions = await this.conditionsRepository.find({
      where: { id: In(ids.map((condition) => condition.id)) },
    });

    const tagsByConditionId = await loadOrderedTagsMap(
      this.conditionTagsRepository,
      conditions.map((condition) => condition.id),
      'condition',
    );
    for (const condition of conditions) {
      condition.tags = tagsByConditionId.get(condition.id) ?? [];
    }

    const conditionsById = new Map(
      conditions.map((condition) => [condition.id, condition]),
    );
    const data = ids
      .map((condition) => conditionsById.get(condition.id))
      .filter((condition): condition is Condition => condition !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateConditionDto): Promise<Condition> {
    const condition = await this.findById(id);
    if (!condition) {
      throw new NotFoundException('Condição não encontrada.');
    }

    if (dto.name && dto.name !== condition.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma condição com este nome.');
      }
      condition.name = dto.name;
    }

    if (dto.description !== undefined) {
      condition.description = dto.description;
    }

    let tags = condition.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.conditionTagsRepository,
        'condition',
        condition,
        tags,
      );
    }

    if (dto.sections !== undefined) {
      // Reatribuir `condition.sections` inteiro e deixar o cascade save cuidar
      // da remoção via orphanedRowAction falha com violação de not-null: o
      // TypeORM tenta primeiro um UPDATE setando "condition_id" = NULL nas
      // linhas órfãs antes de excluí-las, o que quebra a coluna NOT NULL
      // (mesmo problema e mesma solução usada em RulesService/
      // LocationsService.update). Por isso as seções antigas são removidas
      // explicitamente pelo repositório antes de atribuir as novas.
      if (condition.sections.length > 0) {
        await this.conditionSectionsRepository.remove(condition.sections);
      }
      condition.sections =
        dto.sections.length > 0 ? this.buildSections(dto.sections) : [];
    }

    const savedCondition = await this.conditionsRepository.save(condition);
    savedCondition.tags = tags;
    return savedCondition;
  }

  async remove(id: string): Promise<void> {
    const result = await this.conditionsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Condição não encontrada.');
    }
  }
}
