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
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { FindSkillsQueryDto } from './dto/find-skills-query.dto';
import { SkillSectionInputDto } from './dto/skill-section-input.dto';
import { Skill } from './entities/skill.entity';
import { SkillSection } from './entities/skill-section.entity';
import { SkillTag } from './entities/skill-tag.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedSkills {
  data: Skill[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(SkillSection)
    private readonly skillSectionsRepository: Repository<SkillSection>,
    @InjectRepository(Attribute)
    private readonly attributesRepository: Repository<Attribute>,
    @InjectRepository(SkillTag)
    private readonly skillTagsRepository: Repository<SkillTag>,
  ) {}

  findByName(name: string): Promise<Skill | null> {
    return this.skillsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Skill | null> {
    const skill = await this.skillsRepository.findOne({
      where: { id },
      relations: { keyAttribute: true, sections: true },
    });
    if (!skill) {
      return null;
    }
    skill.tags = await loadOrderedTagsForOwner(
      this.skillTagsRepository,
      id,
      'skill',
    );
    return skill;
  }

  findKeyAttributeById(id: string): Promise<Attribute | null> {
    return this.attributesRepository.findOneBy({ id });
  }

  private buildSections(sections: SkillSectionInputDto[]): SkillSection[] {
    return sections.map((section, index) =>
      this.skillSectionsRepository.create({
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

  async create(dto: CreateSkillDto): Promise<Skill> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma perícia com este nome.');
    }

    const keyAttribute = await this.findKeyAttributeById(dto.keyAttributeId);
    if (!keyAttribute) {
      throw new NotFoundException('Atributo chave não encontrado.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const sections =
      dto.sections && dto.sections.length > 0
        ? this.buildSections(dto.sections)
        : [];

    const skill = this.skillsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      keyAttribute,
      sections,
    });

    const savedSkill = await this.skillsRepository.save(skill);
    await createOrderedTagJunctions(
      this.skillTagsRepository,
      'skill',
      savedSkill,
      tags,
    );
    savedSkill.tags = tags;
    return savedSkill;
  }

  async findAllPaginated(query: FindSkillsQueryDto): Promise<PaginatedSkills> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.skillsRepository
      .createQueryBuilder('skill')
      .leftJoin('skill.keyAttribute', 'keyAttribute');

    if (query.name) {
      queryBuilder.andWhere('skill.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.keyAttributeId) {
      queryBuilder.andWhere('skill.keyAttribute = :keyAttributeId', {
        keyAttributeId: query.keyAttributeId,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'skill_tags',
          'skill_tag_filter',
          'skill_tag_filter.skill_id = skill.id AND skill_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('skill.id')
        .having('COUNT(DISTINCT skill_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por perícia). Sem filtro de tags, `getCount()` é suficiente e
    // evita trazer todos os ids para a aplicação só para contá-los. O
    // `leftJoin` com `keyAttribute` convive normalmente com o `groupBy` por
    // `skill.id`: como `id` é a chave primária de `skill` e nenhuma coluna de
    // `keyAttribute` é selecionada, o Postgres permite o agrupamento apenas
    // pela PK (dependência funcional).
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('skill.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['skill.id', 'skill.name'])
      .orderBy('skill.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const skills = await this.skillsRepository.find({
      where: { id: In(ids.map((skill) => skill.id)) },
      relations: { keyAttribute: true },
    });

    const tagsBySkillId = await loadOrderedTagsMap(
      this.skillTagsRepository,
      skills.map((skill) => skill.id),
      'skill',
    );
    for (const skill of skills) {
      skill.tags = tagsBySkillId.get(skill.id) ?? [];
    }

    const skillsById = new Map(skills.map((skill) => [skill.id, skill]));
    const data = ids
      .map((skill) => skillsById.get(skill.id))
      .filter((skill): skill is Skill => skill !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findById(id);
    if (!skill) {
      throw new NotFoundException('Perícia não encontrada.');
    }

    if (dto.name && dto.name !== skill.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma perícia com este nome.');
      }
      skill.name = dto.name;
    }

    if (dto.description !== undefined) {
      skill.description = dto.description;
    }

    if (dto.keyAttributeId && dto.keyAttributeId !== skill.keyAttribute.id) {
      const keyAttribute = await this.findKeyAttributeById(dto.keyAttributeId);
      if (!keyAttribute) {
        throw new NotFoundException('Atributo chave não encontrado.');
      }
      skill.keyAttribute = keyAttribute;
    }

    let tags = skill.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.skillTagsRepository,
        'skill',
        skill,
        tags,
      );
    }

    if (dto.sections !== undefined) {
      // Reatribuir `skill.sections` inteiro e deixar o cascade save cuidar da
      // remoção via orphanedRowAction falha com violação de not-null: o TypeORM
      // tenta primeiro um UPDATE setando "skill_id" = NULL nas linhas órfãs
      // antes de excluí-las, o que quebra a coluna NOT NULL (mesmo problema e
      // mesma solução usada em RulesService/LocationsService.update). Por isso
      // as seções antigas são removidas explicitamente pelo repositório antes
      // de atribuir as novas.
      if (skill.sections.length > 0) {
        await this.skillSectionsRepository.remove(skill.sections);
      }
      skill.sections =
        dto.sections.length > 0 ? this.buildSections(dto.sections) : [];
    }

    const savedSkill = await this.skillsRepository.save(skill);
    savedSkill.tags = tags;
    return savedSkill;
  }

  async remove(id: string): Promise<void> {
    const result = await this.skillsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Perícia não encontrada.');
    }
  }
}
