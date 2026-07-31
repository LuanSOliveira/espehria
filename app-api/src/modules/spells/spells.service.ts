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

export interface PaginatedSpells {
  data: Spell[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class SpellsService {
  constructor(
    @InjectRepository(Spell)
    private readonly spellsRepository: Repository<Spell>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Spell | null> {
    return this.spellsRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Spell | null> {
    return this.spellsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  async create(dto: CreateSpellDto): Promise<Spell> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma magia com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const spell = this.spellsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      tags,
    });

    return this.spellsRepository.save(spell);
  }

  async findAllPaginated(
    query: FindSpellsQueryDto,
  ): Promise<PaginatedSpells> {
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

  async update(id: string, dto: UpdateSpellDto): Promise<Spell> {
    const spell = await this.findById(id);
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

    return this.spellsRepository.save(spell);
  }

  async remove(id: string): Promise<void> {
    const result = await this.spellsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Magia não encontrada.');
    }
  }
}
