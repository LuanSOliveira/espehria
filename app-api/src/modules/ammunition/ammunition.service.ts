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
import { CreateAmmunitionDto } from './dto/create-ammunition.dto';
import { UpdateAmmunitionDto } from './dto/update-ammunition.dto';
import { FindAmmunitionQueryDto } from './dto/find-ammunition-query.dto';
import { Ammunition } from './entities/ammunition.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';

export interface PaginatedAmmunition {
  data: Ammunition[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class AmmunitionService {
  constructor(
    @InjectRepository(Ammunition)
    private readonly ammunitionRepository: Repository<Ammunition>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  findByName(name: string): Promise<Ammunition | null> {
    return this.ammunitionRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Ammunition | null> {
    return this.ammunitionRepository.findOne({
      where: { id },
      relations: { tags: true, currency: true },
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

  private async findCurrencyById(currencyId: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOneBy({
      id: currencyId,
    });
    if (!currency) {
      throw new NotFoundException('Moeda não encontrada.');
    }
    return currency;
  }

  async create(dto: CreateAmmunitionDto): Promise<Ammunition> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        'Já existe um item de munição com este nome.',
      );
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const ammunition = this.ammunitionRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
      tags,
    });

    return this.ammunitionRepository.save(ammunition);
  }

  async findAllPaginated(
    query: FindAmmunitionQueryDto,
  ): Promise<PaginatedAmmunition> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.ammunitionRepository.createQueryBuilder('ammunition');

    if (query.name) {
      queryBuilder.andWhere('ammunition.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['ammunition.id', 'ammunition.name'])
      .orderBy('ammunition.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const ammunitionList = await this.ammunitionRepository.find({
      where: { id: In(ids.map((item) => item.id)) },
      relations: { tags: true, currency: true },
      order: { name: 'ASC' },
    });

    const ammunitionById = new Map(
      ammunitionList.map((item) => [item.id, item]),
    );
    const data = ids
      .map((item) => ammunitionById.get(item.id))
      .filter((item): item is Ammunition => item !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateAmmunitionDto): Promise<Ammunition> {
    const ammunition = await this.findById(id);
    if (!ammunition) {
      throw new NotFoundException('Item de munição não encontrado.');
    }

    if (dto.name && dto.name !== ammunition.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException(
          'Já existe um item de munição com este nome.',
        );
      }
      ammunition.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      ammunition.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      ammunition.description = dto.description;
    }
    if (dto.price !== undefined) {
      ammunition.price = dto.price;
    }
    if (dto.price === null) {
      ammunition.currency = null;
    } else if (dto.currencyId !== undefined) {
      ammunition.currency = await this.findCurrencyById(dto.currencyId);
    }
    if (dto.privateInformation !== undefined) {
      ammunition.privateInformation = dto.privateInformation;
    }
    if (dto.tagIds !== undefined) {
      ammunition.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.ammunitionRepository.save(ammunition);
  }

  async remove(id: string): Promise<void> {
    const result = await this.ammunitionRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Item de munição não encontrado.');
    }
  }
}
