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
import { CreateSpellDto } from './dto/create-spell.dto';
import { UpdateSpellDto } from './dto/update-spell.dto';
import { FindSpellsQueryDto } from './dto/find-spells-query.dto';
import { Spell } from './entities/spell.entity';
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
  improvedFrom: EntityReferenceResponseDto[];
  requirements: EntityReferenceResponseDto[];
}

@Injectable()
export class SpellsService {
  constructor(
    @InjectRepository(Spell)
    private readonly spellsRepository: Repository<Spell>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly entityLinksService: EntityLinksService,
  ) {}

  findByName(name: string): Promise<Spell | null> {
    return this.spellsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<SpellWithReferences | null> {
    const spell = await this.spellsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!spell) {
      return null;
    }

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.SPELL,
        id,
      );

    return { spell, improvedFrom, requirements };
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
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

    const improvedFromInput = dto.improvedFrom ?? [];
    const requirementsInput = dto.requirements ?? [];

    this.entityLinksService.validateLists({
      ownerEntityType: ReferenceableEntityType.SPELL,
      improvedFrom: improvedFromInput,
      requirements: requirementsInput,
    });

    await this.entityLinksService.resolveReferences(improvedFromInput);
    await this.entityLinksService.resolveReferences(requirementsInput);

    const spell = this.spellsRepository.create({
      name: dto.name,
      level: dto.level,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      tags,
    });

    const savedSpell = await this.spellsRepository.save(spell);

    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.SPELL,
      savedSpell.id,
      EntityLinkType.IMPROVED_FROM,
      improvedFromInput,
    );
    await this.entityLinksService.replaceLinks(
      ReferenceableEntityType.SPELL,
      savedSpell.id,
      EntityLinkType.REQUIREMENT,
      requirementsInput,
    );

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.SPELL,
        savedSpell.id,
      );

    return { spell: savedSpell, improvedFrom, requirements };
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

    const [ids, total] = await queryBuilder
      .select(['spell.id', 'spell.name'])
      .orderBy('spell.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const spells = await this.spellsRepository.find({
      where: { id: In(ids.map((spell) => spell.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const spellsById = new Map(spells.map((spell) => [spell.id, spell]));
    const data = ids
      .map((spell) => spellsById.get(spell.id))
      .filter((spell): spell is Spell => spell !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateSpellDto): Promise<SpellWithReferences> {
    const spell = await this.spellsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
    if (!spell) {
      throw new NotFoundException('Magia não encontrada.');
    }

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
    if (dto.tagIds !== undefined) {
      spell.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    let effectiveImprovedFrom = dto.improvedFrom;
    let effectiveRequirements = dto.requirements;

    if (
      effectiveImprovedFrom === undefined ||
      effectiveRequirements === undefined
    ) {
      const current = await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.SPELL,
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
      ownerEntityType: ReferenceableEntityType.SPELL,
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

    const savedSpell = await this.spellsRepository.save(spell);

    if (dto.improvedFrom !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.SPELL,
        id,
        EntityLinkType.IMPROVED_FROM,
        dto.improvedFrom,
      );
    }
    if (dto.requirements !== undefined) {
      await this.entityLinksService.replaceLinks(
        ReferenceableEntityType.SPELL,
        id,
        EntityLinkType.REQUIREMENT,
        dto.requirements,
      );
    }

    const { improvedFrom, requirements } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.SPELL,
        id,
      );

    return { spell: savedSpell, improvedFrom, requirements };
  }

  async remove(id: string): Promise<void> {
    const result = await this.spellsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Magia não encontrada.');
    }
  }
}
