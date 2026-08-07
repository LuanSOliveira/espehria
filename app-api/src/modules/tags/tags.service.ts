import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { FindTagsQueryDto } from './dto/find-tags-query.dto';

export interface PaginatedTags {
  data: Tag[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findById(id: string): Promise<Tag | null> {
    return this.tagsRepository.findOneBy({ id });
  }

  /**
   * Trata string vazia/só espaços como equivalente a `null`, espelhando a
   * semântica de `COALESCE("type", '')` usada no índice único da migration
   * ChangeTagsUniqueIndexToNameAndType.
   */
  private normalizeType(type?: string | null): string | null {
    return type?.trim() ? type.trim() : null;
  }

  findByNameAndType(
    name: string,
    type: string | null,
    excludeId?: string,
  ): Promise<Tag | null> {
    const normalizedType = this.normalizeType(type);
    return this.tagsRepository.findOneBy({
      name,
      type: normalizedType === null ? IsNull() : normalizedType,
      ...(excludeId ? { id: Not(excludeId) } : {}),
    });
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const type = this.normalizeType(dto.type);
    const existing = await this.findByNameAndType(dto.name, type);
    if (existing) {
      throw new ConflictException('Já existe uma tag com este nome e tipo.');
    }

    const tag = this.tagsRepository.create({
      name: dto.name,
      color: dto.color,
      type,
    });
    return this.tagsRepository.save(tag);
  }

  async findAllPaginated(query: FindTagsQueryDto): Promise<PaginatedTags> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.tagsRepository.createQueryBuilder('tag');

    if (query.name) {
      queryBuilder.andWhere('tag.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('tag.type ILIKE :type', {
        type: `%${query.type}%`,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('tag.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findById(id);
    if (!tag) {
      throw new NotFoundException('Tag não encontrada.');
    }

    const finalName = dto.name ?? tag.name;
    const finalType =
      dto.type !== undefined ? this.normalizeType(dto.type) : tag.type;

    if (finalName !== tag.name || finalType !== tag.type) {
      const existing = await this.findByNameAndType(finalName, finalType, id);
      if (existing) {
        throw new ConflictException('Já existe uma tag com este nome e tipo.');
      }
    }

    tag.name = finalName;
    tag.color = dto.color ?? tag.color;
    tag.type = finalType;

    return this.tagsRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tagsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Tag não encontrada.');
    }
  }
}
