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
import { CreateTalentDto } from './dto/create-talent.dto';
import { UpdateTalentDto } from './dto/update-talent.dto';
import { FindTalentsQueryDto } from './dto/find-talents-query.dto';
import { Talent } from './entities/talent.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedTalents {
  data: Talent[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class TalentsService {
  constructor(
    @InjectRepository(Talent)
    private readonly talentsRepository: Repository<Talent>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Talent | null> {
    return this.talentsRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Talent | null> {
    return this.talentsRepository.findOne({
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

  async create(dto: CreateTalentDto): Promise<Talent> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um talento com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const talent = this.talentsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      tags,
    });

    return this.talentsRepository.save(talent);
  }

  async findAllPaginated(
    query: FindTalentsQueryDto,
  ): Promise<PaginatedTalents> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.talentsRepository.createQueryBuilder('talent');

    if (query.name) {
      queryBuilder.andWhere('talent.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['talent.id', 'talent.name'])
      .orderBy('talent.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const talents = await this.talentsRepository.find({
      where: { id: In(ids.map((talent) => talent.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const talentsById = new Map(talents.map((talent) => [talent.id, talent]));
    const data = ids
      .map((talent) => talentsById.get(talent.id))
      .filter((talent): talent is Talent => talent !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateTalentDto): Promise<Talent> {
    const talent = await this.findById(id);
    if (!talent) {
      throw new NotFoundException('Talento não encontrado.');
    }

    if (dto.name && dto.name !== talent.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um talento com este nome.');
      }
      talent.name = dto.name;
    }

    if (dto.description !== undefined) {
      talent.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      talent.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.talentsRepository.save(talent);
  }

  async remove(id: string): Promise<void> {
    const result = await this.talentsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Talento não encontrado.');
    }
  }
}
