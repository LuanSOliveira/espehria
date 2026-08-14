import { Injectable, NotFoundException } from '@nestjs/common';
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
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FindEventsQueryDto } from './dto/find-events-query.dto';
import { Event } from './entities/event.entity';
import { EventTag } from './entities/event-tag.entity';
import { Era } from '../eras/entities/era.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedEvents {
  data: Event[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Era)
    private readonly erasRepository: Repository<Era>,
    @InjectRepository(EventTag)
    private readonly eventTagsRepository: Repository<EventTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async findById(id: string): Promise<Event | null> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { era: true },
    });
    if (!event) {
      return null;
    }
    event.tags = await loadOrderedTagsForOwner(
      this.eventTagsRepository,
      id,
      'event',
    );
    return event;
  }

  findEraById(id: string): Promise<Era | null> {
    return this.erasRepository.findOneBy({ id });
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

  async create(dto: CreateEventDto): Promise<Event> {
    let era: Era | null = null;
    if (dto.eraId) {
      era = await this.findEraById(dto.eraId);
      if (!era) {
        throw new NotFoundException('Era não encontrada.');
      }
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const event = this.eventsRepository.create({
      name: dto.name,
      referenceImageUrl: dto.referenceImageUrl ?? null,
      startYear: dto.startYear ?? null,
      endYear: dto.endYear ?? null,
      description: dto.description ?? null,
      privateInformation: dto.privateInformation ?? null,
      era,
    });

    const savedEvent = await this.eventsRepository.save(event);
    await createOrderedTagJunctions(
      this.eventTagsRepository,
      'event',
      savedEvent,
      tags,
    );
    savedEvent.tags = tags;
    return savedEvent;
  }

  async findAllPaginated(query: FindEventsQueryDto): Promise<PaginatedEvents> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin('event.era', 'era');

    if (query.name) {
      queryBuilder.andWhere('event.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.eraId) {
      queryBuilder.andWhere('event.era = :eraId', { eraId: query.eraId });
    }

    if (query.startYear !== undefined) {
      queryBuilder.andWhere('event.startYear = :startYear', {
        startYear: query.startYear,
      });
    }

    if (query.endYear !== undefined) {
      queryBuilder.andWhere('event.endYear = :endYear', {
        endYear: query.endYear,
      });
    }

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'event_tags',
          'event_tag_filter',
          'event_tag_filter.event_id = event.id AND event_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('event.id')
        .having('COUNT(DISTINCT event_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por evento). Sem filtro de tags, `getCount()` é suficiente e evita
    // trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('event.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['event.id', 'event.name'])
      .orderBy('event.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const events = await this.eventsRepository.find({
      where: { id: In(ids.map((event) => event.id)) },
      relations: { era: true },
    });

    const tagsByEventId = await loadOrderedTagsMap(
      this.eventTagsRepository,
      events.map((event) => event.id),
      'event',
    );
    for (const event of events) {
      event.tags = tagsByEventId.get(event.id) ?? [];
    }

    const eventsById = new Map(events.map((event) => [event.id, event]));
    const data = ids
      .map((event) => eventsById.get(event.id))
      .filter((event): event is Event => event !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findById(id);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (dto.name !== undefined) {
      event.name = dto.name;
    }
    if (dto.referenceImageUrl !== undefined) {
      event.referenceImageUrl = dto.referenceImageUrl;
    }
    if (dto.startYear !== undefined) {
      event.startYear = dto.startYear;
    }
    if (dto.endYear !== undefined) {
      event.endYear = dto.endYear;
    }
    if (dto.description !== undefined) {
      event.description = dto.description;
    }
    if (dto.privateInformation !== undefined) {
      event.privateInformation = dto.privateInformation;
    }

    if (dto.eraId !== undefined) {
      if (dto.eraId === null) {
        event.era = null;
      } else {
        const era = await this.findEraById(dto.eraId);
        if (!era) {
          throw new NotFoundException('Era não encontrada.');
        }
        event.era = era;
      }
    }

    let tags = event.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.eventTagsRepository,
        'event',
        event,
        tags,
      );
    }

    const savedEvent = await this.eventsRepository.save(event);
    savedEvent.tags = tags;
    return savedEvent;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Evento não encontrado.');
    }
  }
}
