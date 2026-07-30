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
import { CreateUtilityDto } from './dto/create-utility.dto';
import { UpdateUtilityDto } from './dto/update-utility.dto';
import { FindUtilitiesQueryDto } from './dto/find-utilities-query.dto';
import { Utility } from './entities/utility.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedUtilities {
  data: Utility[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class UtilitiesService {
  constructor(
    @InjectRepository(Utility)
    private readonly utilitiesRepository: Repository<Utility>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Utility | null> {
    return this.utilitiesRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Utility | null> {
    return this.utilitiesRepository.findOne({
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

  async create(dto: CreateUtilityDto): Promise<Utility> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um utilitário com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const utility = this.utilitiesRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      privateInformation: dto.privateInformation ?? null,
      tags,
    });

    return this.utilitiesRepository.save(utility);
  }

  async findAllPaginated(
    query: FindUtilitiesQueryDto,
  ): Promise<PaginatedUtilities> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.utilitiesRepository.createQueryBuilder('utility');

    if (query.name) {
      queryBuilder.andWhere('utility.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['utility.id', 'utility.name'])
      .orderBy('utility.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const utilities = await this.utilitiesRepository.find({
      where: { id: In(ids.map((utility) => utility.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const utilitiesById = new Map(
      utilities.map((utility) => [utility.id, utility]),
    );
    const data = ids
      .map((utility) => utilitiesById.get(utility.id))
      .filter((utility): utility is Utility => utility !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateUtilityDto): Promise<Utility> {
    const utility = await this.findById(id);
    if (!utility) {
      throw new NotFoundException('Utilitário não encontrado.');
    }

    if (dto.name && dto.name !== utility.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um utilitário com este nome.');
      }
      utility.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      utility.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      utility.description = dto.description;
    }
    if (dto.price !== undefined) {
      utility.price = dto.price;
    }
    if (dto.privateInformation !== undefined) {
      utility.privateInformation = dto.privateInformation;
    }
    if (dto.tagIds !== undefined) {
      utility.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.utilitiesRepository.save(utility);
  }

  async remove(id: string): Promise<void> {
    const result = await this.utilitiesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Utilitário não encontrado.');
    }
  }
}
