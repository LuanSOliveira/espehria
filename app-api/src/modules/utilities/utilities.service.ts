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
import { CreateUtilityDto } from './dto/create-utility.dto';
import { UpdateUtilityDto } from './dto/update-utility.dto';
import { FindUtilitiesQueryDto } from './dto/find-utilities-query.dto';
import { Utility } from './entities/utility.entity';
import { UtilityTag } from './entities/utility-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';

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
    @InjectRepository(UtilityTag)
    private readonly utilityTagsRepository: Repository<UtilityTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  findByName(name: string): Promise<Utility | null> {
    return this.utilitiesRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Utility | null> {
    const utility = await this.utilitiesRepository.findOne({
      where: { id },
      relations: { currency: true },
    });
    if (!utility) {
      return null;
    }
    utility.tags = await loadOrderedTagsForOwner(
      this.utilityTagsRepository,
      id,
      'utility',
    );
    return utility;
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

  /**
   * Monta uma instância de `Utility` com as relações resolvidas (moeda, tags), sem
   * persistir nada — usada para gerar o snapshot de um item avulso de inventário de
   * ficha (`SheetsService`), reaproveitando a mesma resolução de referências usada em
   * `create()`.
   */
  async buildSnapshotFromDto(dto: CreateUtilityDto): Promise<Utility> {
    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const utility = this.utilitiesRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
      volume: dto.volume ?? null,
    });
    utility.tags = tags;
    return utility;
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

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const utility = this.utilitiesRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
      volume: dto.volume ?? null,
    });

    const savedUtility = await this.utilitiesRepository.save(utility);
    await createOrderedTagJunctions(
      this.utilityTagsRepository,
      'utility',
      savedUtility,
      tags,
    );
    savedUtility.tags = tags;
    return savedUtility;
  }

  async findAllPaginated(
    query: FindUtilitiesQueryDto,
  ): Promise<PaginatedUtilities> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.utilitiesRepository.createQueryBuilder('utility');

    if (query.name) {
      queryBuilder.andWhere('utility.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'utility_tags',
          'utility_tag_filter',
          'utility_tag_filter.utility_id = utility.id AND utility_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('utility.id')
        .having('COUNT(DISTINCT utility_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (um por utilitário). Sem filtro de tags, `getCount()` é suficiente e
    // evita trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('utility.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['utility.id', 'utility.name'])
      .orderBy('utility.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const utilities = await this.utilitiesRepository.find({
      where: { id: In(ids.map((utility) => utility.id)) },
      relations: { currency: true },
      order: { name: 'ASC' },
    });

    const tagsByUtilityId = await loadOrderedTagsMap(
      this.utilityTagsRepository,
      utilities.map((utility) => utility.id),
      'utility',
    );
    for (const utility of utilities) {
      utility.tags = tagsByUtilityId.get(utility.id) ?? [];
    }

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
    if (dto.price === null) {
      utility.currency = null;
    } else if (dto.currencyId !== undefined) {
      utility.currency = await this.findCurrencyById(dto.currencyId);
    }
    if (dto.privateInformation !== undefined) {
      utility.privateInformation = dto.privateInformation;
    }
    if (dto.volume !== undefined) {
      utility.volume = dto.volume;
    }
    let tags = utility.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.utilityTagsRepository,
        'utility',
        utility,
        tags,
      );
    }

    const savedUtility = await this.utilitiesRepository.save(utility);
    savedUtility.tags = tags;
    return savedUtility;
  }

  async remove(id: string): Promise<void> {
    const result = await this.utilitiesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Utilitário não encontrado.');
    }
  }
}
