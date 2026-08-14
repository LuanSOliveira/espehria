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
import { CreateShieldDto } from './dto/create-shield.dto';
import { UpdateShieldDto } from './dto/update-shield.dto';
import { FindShieldsQueryDto } from './dto/find-shields-query.dto';
import { Shield } from './entities/shield.entity';
import { ShieldTag } from './entities/shield-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';

export interface PaginatedShields {
  data: Shield[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class ShieldsService {
  constructor(
    @InjectRepository(Shield)
    private readonly shieldsRepository: Repository<Shield>,
    @InjectRepository(ShieldTag)
    private readonly shieldTagsRepository: Repository<ShieldTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  findByName(name: string): Promise<Shield | null> {
    return this.shieldsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Shield | null> {
    const shield = await this.shieldsRepository.findOne({
      where: { id },
      relations: { currency: true },
    });
    if (!shield) {
      return null;
    }
    shield.tags = await loadOrderedTagsForOwner(
      this.shieldTagsRepository,
      id,
      'shield',
    );
    return shield;
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

  async create(dto: CreateShieldDto): Promise<Shield> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um escudo com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const shield = this.shieldsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
    });

    const savedShield = await this.shieldsRepository.save(shield);
    await createOrderedTagJunctions(
      this.shieldTagsRepository,
      'shield',
      savedShield,
      tags,
    );
    savedShield.tags = tags;
    return savedShield;
  }

  async findAllPaginated(
    query: FindShieldsQueryDto,
  ): Promise<PaginatedShields> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.shieldsRepository.createQueryBuilder('shield');

    if (query.name) {
      queryBuilder.andWhere('shield.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'shield_tags',
          'shield_tag_filter',
          'shield_tag_filter.shield_id = shield.id AND shield_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('shield.id')
        .having('COUNT(DISTINCT shield_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por escudo). Sem filtro de tags, `getCount()` é suficiente e evita
    // trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('shield.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['shield.id', 'shield.name'])
      .orderBy('shield.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const shields = await this.shieldsRepository.find({
      where: { id: In(ids.map((shield) => shield.id)) },
      relations: { currency: true },
      order: { name: 'ASC' },
    });

    const tagsByShieldId = await loadOrderedTagsMap(
      this.shieldTagsRepository,
      shields.map((shield) => shield.id),
      'shield',
    );
    for (const shield of shields) {
      shield.tags = tagsByShieldId.get(shield.id) ?? [];
    }

    const shieldsById = new Map(shields.map((shield) => [shield.id, shield]));
    const data = ids
      .map((shield) => shieldsById.get(shield.id))
      .filter((shield): shield is Shield => shield !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateShieldDto): Promise<Shield> {
    const shield = await this.findById(id);
    if (!shield) {
      throw new NotFoundException('Escudo não encontrado.');
    }

    if (dto.name && dto.name !== shield.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um escudo com este nome.');
      }
      shield.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      shield.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      shield.description = dto.description;
    }
    if (dto.price !== undefined) {
      shield.price = dto.price;
    }
    if (dto.price === null) {
      shield.currency = null;
    } else if (dto.currencyId !== undefined) {
      shield.currency = await this.findCurrencyById(dto.currencyId);
    }
    if (dto.privateInformation !== undefined) {
      shield.privateInformation = dto.privateInformation;
    }
    let tags = shield.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.shieldTagsRepository,
        'shield',
        shield,
        tags,
      );
    }

    const savedShield = await this.shieldsRepository.save(shield);
    savedShield.tags = tags;
    return savedShield;
  }

  async remove(id: string): Promise<void> {
    const result = await this.shieldsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Escudo não encontrado.');
    }
  }
}
