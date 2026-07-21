import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  findByName(name: string): Promise<Tag | null> {
    return this.tagsRepository.findOneBy({ name });
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Este nome já está em uso.');
    }

    const tag = this.tagsRepository.create({
      name: dto.name,
      color: dto.color,
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

    if (dto.name && dto.name !== tag.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Este nome já está em uso.');
      }
      tag.name = dto.name;
    }

    if (dto.color) {
      tag.color = dto.color;
    }

    return this.tagsRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tagsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Tag não encontrada.');
    }
  }
}
