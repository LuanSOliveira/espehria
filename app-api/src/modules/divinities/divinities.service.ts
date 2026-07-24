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
import { CreateDivinityDto } from './dto/create-divinity.dto';
import { UpdateDivinityDto } from './dto/update-divinity.dto';
import { FindDivinitiesQueryDto } from './dto/find-divinities-query.dto';
import { Divinity } from './entities/divinity.entity';
import { DivinityCategory } from './entities/divinity-category.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedDivinities {
  data: Divinity[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class DivinitiesService {
  constructor(
    @InjectRepository(Divinity)
    private readonly divinitiesRepository: Repository<Divinity>,
    @InjectRepository(DivinityCategory)
    private readonly divinityCategoriesRepository: Repository<DivinityCategory>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Divinity | null> {
    return this.divinitiesRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Divinity | null> {
    return this.divinitiesRepository.findOne({
      where: { id },
      relations: { category: true, tags: true },
    });
  }

  findCategoryById(id: string): Promise<DivinityCategory | null> {
    return this.divinityCategoriesRepository.findOneBy({ id });
  }

  findAllCategories(): Promise<DivinityCategory[]> {
    return this.divinityCategoriesRepository.find({
      order: { name: 'ASC' },
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

  async create(dto: CreateDivinityDto): Promise<Divinity> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma divindade com este nome.');
    }

    const category = await this.findCategoryById(dto.categoryId);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const divinity = this.divinitiesRepository.create({
      name: dto.name,
      category,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      tags,
    });

    return this.divinitiesRepository.save(divinity);
  }

  async findAllPaginated(
    query: FindDivinitiesQueryDto,
  ): Promise<PaginatedDivinities> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.divinitiesRepository
      .createQueryBuilder('divinity')
      .leftJoin('divinity.category', 'category');

    if (query.name) {
      queryBuilder.andWhere('divinity.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('divinity.category = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['divinity.id', 'divinity.name'])
      .orderBy('divinity.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const divinities = await this.divinitiesRepository.find({
      where: { id: In(ids.map((divinity) => divinity.id)) },
      relations: { category: true, tags: true },
      order: { name: 'ASC' },
    });

    const divinitiesById = new Map(
      divinities.map((divinity) => [divinity.id, divinity]),
    );
    const data = ids
      .map((divinity) => divinitiesById.get(divinity.id))
      .filter((divinity): divinity is Divinity => divinity !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateDivinityDto): Promise<Divinity> {
    const divinity = await this.divinitiesRepository.findOne({
      where: { id },
      relations: { category: true, tags: true },
    });
    if (!divinity) {
      throw new NotFoundException('Divindade não encontrada.');
    }

    if (dto.name && dto.name !== divinity.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma divindade com este nome.');
      }
      divinity.name = dto.name;
    }

    if (dto.categoryId && dto.categoryId !== divinity.category.id) {
      const category = await this.findCategoryById(dto.categoryId);
      if (!category) {
        throw new NotFoundException('Categoria não encontrada.');
      }
      divinity.category = category;
    }

    if (dto.referenceImage !== undefined) {
      divinity.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      divinity.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      divinity.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.divinitiesRepository.save(divinity);
  }

  async remove(id: string): Promise<void> {
    const result = await this.divinitiesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Divindade não encontrada.');
    }
  }
}
