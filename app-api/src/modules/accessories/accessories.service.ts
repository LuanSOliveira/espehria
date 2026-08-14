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
import { CreateAccessoryDto } from './dto/create-accessory.dto';
import { UpdateAccessoryDto } from './dto/update-accessory.dto';
import { FindAccessoriesQueryDto } from './dto/find-accessories-query.dto';
import { Accessory } from './entities/accessory.entity';
import { AccessoryTag } from './entities/accessory-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';

export interface PaginatedAccessories {
  data: Accessory[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class AccessoriesService {
  constructor(
    @InjectRepository(Accessory)
    private readonly accessoriesRepository: Repository<Accessory>,
    @InjectRepository(AccessoryTag)
    private readonly accessoryTagsRepository: Repository<AccessoryTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  findByName(name: string): Promise<Accessory | null> {
    return this.accessoriesRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Accessory | null> {
    const accessory = await this.accessoriesRepository.findOne({
      where: { id },
      relations: { currency: true },
    });
    if (!accessory) {
      return null;
    }
    accessory.tags = await loadOrderedTagsForOwner(
      this.accessoryTagsRepository,
      id,
      'accessory',
    );
    return accessory;
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

  private async findCurrencyById(currencyId: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOneBy({
      id: currencyId,
    });
    if (!currency) {
      throw new NotFoundException('Moeda não encontrada.');
    }
    return currency;
  }

  async create(dto: CreateAccessoryDto): Promise<Accessory> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um acessório com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const accessory = this.accessoriesRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
    });

    const savedAccessory = await this.accessoriesRepository.save(accessory);
    await createOrderedTagJunctions(
      this.accessoryTagsRepository,
      'accessory',
      savedAccessory,
      tags,
    );
    savedAccessory.tags = tags;
    return savedAccessory;
  }

  async findAllPaginated(
    query: FindAccessoriesQueryDto,
  ): Promise<PaginatedAccessories> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.accessoriesRepository.createQueryBuilder('accessory');

    if (query.name) {
      queryBuilder.andWhere('accessory.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'accessory_tags',
          'accessory_tag_filter',
          'accessory_tag_filter.accessory_id = accessory.id AND accessory_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('accessory.id')
        .having('COUNT(DISTINCT accessory_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (um por acessório). Sem filtro de tags, `getCount()` é suficiente e
    // evita trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('accessory.id').getRawMany())
          .length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['accessory.id', 'accessory.name'])
      .orderBy('accessory.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const accessories = await this.accessoriesRepository.find({
      where: { id: In(ids.map((accessory) => accessory.id)) },
      relations: { currency: true },
      order: { name: 'ASC' },
    });

    const tagsByAccessoryId = await loadOrderedTagsMap(
      this.accessoryTagsRepository,
      accessories.map((accessory) => accessory.id),
      'accessory',
    );
    for (const accessory of accessories) {
      accessory.tags = tagsByAccessoryId.get(accessory.id) ?? [];
    }

    const accessoriesById = new Map(
      accessories.map((accessory) => [accessory.id, accessory]),
    );
    const data = ids
      .map((accessory) => accessoriesById.get(accessory.id))
      .filter((accessory): accessory is Accessory => accessory !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateAccessoryDto): Promise<Accessory> {
    const accessory = await this.findById(id);
    if (!accessory) {
      throw new NotFoundException('Acessório não encontrado.');
    }

    if (dto.name && dto.name !== accessory.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um acessório com este nome.');
      }
      accessory.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      accessory.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      accessory.description = dto.description;
    }
    if (dto.price !== undefined) {
      accessory.price = dto.price;
    }
    if (dto.price === null) {
      accessory.currency = null;
    } else if (dto.currencyId !== undefined) {
      accessory.currency = await this.findCurrencyById(dto.currencyId);
    }
    if (dto.privateInformation !== undefined) {
      accessory.privateInformation = dto.privateInformation;
    }
    let tags = accessory.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.accessoryTagsRepository,
        'accessory',
        accessory,
        tags,
      );
    }

    const savedAccessory = await this.accessoriesRepository.save(accessory);
    savedAccessory.tags = tags;
    return savedAccessory;
  }

  async remove(id: string): Promise<void> {
    const result = await this.accessoriesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Acessório não encontrado.');
    }
  }
}
