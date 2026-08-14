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
import { CreateSpellDto } from './dto/create-spell.dto';
import { UpdateSpellDto } from './dto/update-spell.dto';
import { FindSpellsQueryDto } from './dto/find-spells-query.dto';
import { Spell } from './entities/spell.entity';
import { SpellTag } from './entities/spell-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksService } from '../entity-links/entity-links.service';
import { EntityLinkType } from '../entity-links/enums/entity-link-type.enum';
import { ReferenceableEntityType } from '../entity-links/enums/referenceable-entity-type.enum';
import { EntityReferenceInputDto } from '../entity-links/dto/entity-reference-input.dto';
import { EntityReferenceResponseDto } from '../entity-links/dto/entity-reference-response.dto';

export interface PaginatedSpells {
  data: Spell[];
  total: number;
  page: number;
  perPage: number;
}

export interface SpellWithReferences {
  spell: Spell;
  requirements: EntityReferenceResponseDto[];
}

@Injectable()
export class SpellsService {
  constructor(
    @InjectRepository(Spell)
    private readonly spellsRepository: Repository<Spell>,
    @InjectRepository(SpellTag)
    private readonly spellTagsRepository: Repository<SpellTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
  ) {}

  findByName(name: string): Promise<Spell | null> {
    return this.spellsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<SpellWithReferences | null> {
    const spell = await this.spellsRepository.findOneBy({ id });
    if (!spell) {
      return null;
    }
    spell.tags = await loadOrderedTagsForOwner(
      this.spellTagsRepository,
      id,
      'spell',
    );

    const { requirements } = await this.entityLinksService.loadReferencesFor(
      ReferenceableEntityType.SPELL,
      id,
    );

    return { spell, requirements };
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

  async create(dto: CreateSpellDto): Promise<SpellWithReferences> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma magia com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const requirementsInput = dto.requirements ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.SPELL,
      requirements: requirementsInput,
    });

    await this.entityLinksService.resolveReferences(requirementsInput);

    const spell = this.spellsRepository.create({
      name: dto.name,
      level: dto.level,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
    });

    const savedSpell = await this.spellsRepository.save(spell);
    await createOrderedTagJunctions(
      this.spellTagsRepository,
      'spell',
      savedSpell,
      tags,
    );
    savedSpell.tags = tags;

    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.SPELL,
      savedSpell.id,
      EntityLinkType.REQUIREMENT,
      requirementsInput,
    );

    const { requirements } = await this.entityLinksService.loadReferencesFor(
      ReferenceableEntityType.SPELL,
      savedSpell.id,
    );

    return { spell: savedSpell, requirements };
  }

  async findAllPaginated(query: FindSpellsQueryDto): Promise<PaginatedSpells> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.spellsRepository.createQueryBuilder('spell');

    if (query.name) {
      queryBuilder.andWhere('spell.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'spell_tags',
          'spell_tag_filter',
          'spell_tag_filter.spell_id = spell.id AND spell_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('spell.id')
        .having('COUNT(DISTINCT spell_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por magia). Sem filtro de tags, `getCount()` é suficiente e evita
    // trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('spell.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['spell.id', 'spell.name'])
      .orderBy('spell.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const spells = await this.spellsRepository.find({
      where: { id: In(ids.map((spell) => spell.id)) },
      order: { name: 'ASC' },
    });

    const tagsBySpellId = await loadOrderedTagsMap(
      this.spellTagsRepository,
      spells.map((spell) => spell.id),
      'spell',
    );
    for (const spell of spells) {
      spell.tags = tagsBySpellId.get(spell.id) ?? [];
    }

    const spellsById = new Map(spells.map((spell) => [spell.id, spell]));
    const data = ids
      .map((spell) => spellsById.get(spell.id))
      .filter((spell): spell is Spell => spell !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateSpellDto): Promise<SpellWithReferences> {
    const spell = await this.spellsRepository.findOneBy({ id });
    if (!spell) {
      throw new NotFoundException('Magia não encontrada.');
    }
    spell.tags = await loadOrderedTagsForOwner(
      this.spellTagsRepository,
      id,
      'spell',
    );

    if (dto.name && dto.name !== spell.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma magia com este nome.');
      }
      spell.name = dto.name;
    }

    if (dto.level !== undefined) {
      spell.level = dto.level;
    }
    if (dto.referenceImage !== undefined) {
      spell.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      spell.description = dto.description;
    }
    let tags = spell.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.spellTagsRepository,
        'spell',
        spell,
        tags,
      );
    }

    let effectiveRequirements = dto.requirements;

    if (effectiveRequirements === undefined) {
      const current = await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.SPELL,
        id,
      );
      effectiveRequirements = current.requirements.map(
        (ref): EntityReferenceInputDto => ({
          entityType: ref.entityType,
          id: ref.id,
        }),
      );
    }

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.SPELL,
      ownerId: id,
      requirements: effectiveRequirements,
    });

    if (dto.requirements !== undefined) {
      await this.entityLinksService.resolveReferences(dto.requirements);
    }

    const savedSpell = await this.spellsRepository.save(spell);
    savedSpell.tags = tags;

    if (dto.requirements !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.SPELL,
        id,
        EntityLinkType.REQUIREMENT,
        dto.requirements,
      );
    }

    const { requirements } = await this.entityLinksService.loadReferencesFor(
      ReferenceableEntityType.SPELL,
      id,
    );

    return { spell: savedSpell, requirements };
  }

  async remove(id: string): Promise<void> {
    const result = await this.spellsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Magia não encontrada.');
    }
  }
}
