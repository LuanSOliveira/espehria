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
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';
import { FindConsumablesQueryDto } from './dto/find-consumables-query.dto';
import { Consumable } from './entities/consumable.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedConsumables {
  data: Consumable[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class ConsumablesService {
  constructor(
    @InjectRepository(Consumable)
    private readonly consumablesRepository: Repository<Consumable>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Consumable | null> {
    return this.consumablesRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Consumable | null> {
    return this.consumablesRepository.findOne({
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

  async create(dto: CreateConsumableDto): Promise<Consumable> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um consumível com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const consumable = this.consumablesRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      privateInformation: dto.privateInformation ?? null,
      tags,
    });

    return this.consumablesRepository.save(consumable);
  }

  async findAllPaginated(
    query: FindConsumablesQueryDto,
  ): Promise<PaginatedConsumables> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.consumablesRepository.createQueryBuilder('consumable');

    if (query.name) {
      queryBuilder.andWhere('consumable.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['consumable.id', 'consumable.name'])
      .orderBy('consumable.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const consumables = await this.consumablesRepository.find({
      where: { id: In(ids.map((consumable) => consumable.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const consumablesById = new Map(
      consumables.map((consumable) => [consumable.id, consumable]),
    );
    const data = ids
      .map((consumable) => consumablesById.get(consumable.id))
      .filter(
        (consumable): consumable is Consumable => consumable !== undefined,
      );

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateConsumableDto): Promise<Consumable> {
    const consumable = await this.findById(id);
    if (!consumable) {
      throw new NotFoundException('Consumível não encontrado.');
    }

    if (dto.name && dto.name !== consumable.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um consumível com este nome.');
      }
      consumable.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      consumable.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      consumable.description = dto.description;
    }
    if (dto.price !== undefined) {
      consumable.price = dto.price;
    }
    if (dto.privateInformation !== undefined) {
      consumable.privateInformation = dto.privateInformation;
    }
    if (dto.tagIds !== undefined) {
      consumable.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.consumablesRepository.save(consumable);
  }

  async remove(id: string): Promise<void> {
    const result = await this.consumablesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Consumível não encontrado.');
    }
  }
}
