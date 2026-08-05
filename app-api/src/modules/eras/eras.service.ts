import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';
import { FindErasQueryDto } from './dto/find-eras-query.dto';
import { Era } from './entities/era.entity';
import { EraTag } from './entities/era-tag.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedEras {
  data: Era[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class ErasService {
  constructor(
    @InjectRepository(Era)
    private readonly erasRepository: Repository<Era>,
    @InjectRepository(EraTag)
    private readonly eraTagsRepository: Repository<EraTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly dataSource: DataSource,
  ) {}

  findByName(name: string): Promise<Era | null> {
    return this.erasRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Era | null> {
    const era = await this.erasRepository.findOneBy({ id });
    if (!era) {
      return null;
    }
    era.tags = await loadOrderedTagsForOwner(
      this.eraTagsRepository,
      id,
      'era',
    );
    return era;
  }

  findAllOrdered(): Promise<Era[]> {
    return this.erasRepository.find({ order: { order: 'ASC' } });
  }

  private async findTagsByIds(
    tagIds: string[],
    repository: Repository<Tag> = this.tagsRepository,
  ): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await repository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    return uniqueIds.map((id) => tagsById.get(id)!);
  }

  async create(dto: CreateEraDto): Promise<Era> {
    return this.dataSource.transaction(async (manager) => {
      const erasRepository = manager.getRepository(Era);

      const existing = await erasRepository.findOneBy({ name: dto.name });
      if (existing) {
        throw new ConflictException('Já existe uma era com este nome.');
      }

      const count = await erasRepository.count();
      // Validação de robustez adicional: garante que `order` esteja dentro do
      // intervalo de posições possíveis (1..count+1), coerente com as opções
      // de ordenação exibidas no frontend.
      if (dto.order < 1 || dto.order > count + 1) {
        throw new BadRequestException('A posição informada é inválida.');
      }

      const tags =
        dto.tagIds && dto.tagIds.length > 0
          ? await this.findTagsByIds(dto.tagIds, manager.getRepository(Tag))
          : [];

      await manager.query(
        'UPDATE eras SET ordering = ordering + 1 WHERE ordering >= $1',
        [dto.order],
      );

      const era = erasRepository.create({
        name: dto.name,
        referenceImageUrl: dto.referenceImageUrl ?? null,
        description: dto.description ?? null,
        privateInformation: dto.privateInformation ?? null,
        order: dto.order,
      });

      const savedEra = await erasRepository.save(era);
      await createOrderedTagJunctions(
        manager.getRepository(EraTag),
        'era',
        savedEra,
        tags,
      );
      savedEra.tags = tags;
      return savedEra;
    });
  }

  async findAllPaginated(query: FindErasQueryDto): Promise<PaginatedEras> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.erasRepository.createQueryBuilder('era');

    if (query.name) {
      queryBuilder.andWhere('era.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['era.id'])
      .orderBy('era.order', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const eras = await this.erasRepository.find({
      where: { id: In(ids.map((era) => era.id)) },
      order: { order: 'ASC' },
    });

    const tagsByEraId = await loadOrderedTagsMap(
      this.eraTagsRepository,
      eras.map((era) => era.id),
      'era',
    );
    for (const era of eras) {
      era.tags = tagsByEraId.get(era.id) ?? [];
    }

    const erasById = new Map(eras.map((era) => [era.id, era]));
    const data = ids
      .map((era) => erasById.get(era.id))
      .filter((era): era is Era => era !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateEraDto): Promise<Era> {
    return this.dataSource.transaction(async (manager) => {
      const erasRepository = manager.getRepository(Era);

      const era = await erasRepository.findOneBy({ id });
      if (!era) {
        throw new NotFoundException('Era não encontrada.');
      }
      era.tags = await loadOrderedTagsForOwner(
        manager.getRepository(EraTag),
        id,
        'era',
      );

      if (dto.name && dto.name !== era.name) {
        const existing = await erasRepository.findOneBy({ name: dto.name });
        if (existing) {
          throw new ConflictException('Já existe uma era com este nome.');
        }
        era.name = dto.name;
      }

      if (dto.referenceImageUrl !== undefined) {
        era.referenceImageUrl = dto.referenceImageUrl;
      }
      if (dto.description !== undefined) {
        era.description = dto.description;
      }
      if (dto.privateInformation !== undefined) {
        era.privateInformation = dto.privateInformation;
      }
      let tags = era.tags;
      if (dto.tagIds !== undefined) {
        tags =
          dto.tagIds.length > 0
            ? await this.findTagsByIds(dto.tagIds, manager.getRepository(Tag))
            : [];
        await replaceOrderedTagJunctions(
          manager.getRepository(EraTag),
          'era',
          era,
          tags,
        );
      }

      if (dto.order !== undefined && dto.order !== era.order) {
        const currentOrder = era.order;
        const newOrder = dto.order;
        const count = await erasRepository.count();

        if (newOrder < 1 || newOrder > count) {
          throw new BadRequestException('A posição informada é inválida.');
        }

        if (newOrder < currentOrder) {
          await manager.query(
            'UPDATE eras SET ordering = ordering + 1 WHERE ordering >= $1 AND ordering <= $2',
            [newOrder, currentOrder - 1],
          );
        } else {
          await manager.query(
            'UPDATE eras SET ordering = ordering - 1 WHERE ordering >= $1 AND ordering <= $2',
            [currentOrder + 1, newOrder],
          );
        }

        era.order = newOrder;
      }

      const savedEra = await erasRepository.save(era);
      savedEra.tags = tags;
      return savedEra;
    });
  }

  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const erasRepository = manager.getRepository(Era);

      const era = await erasRepository.findOneBy({ id });
      if (!era) {
        throw new NotFoundException('Era não encontrada.');
      }

      await erasRepository.delete({ id });

      await manager.query(
        'UPDATE eras SET ordering = ordering - 1 WHERE ordering > $1',
        [era.order],
      );
    });
  }
}
