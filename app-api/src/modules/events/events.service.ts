import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FindEventsQueryDto } from './dto/find-events-query.dto';
import { Event } from './entities/event.entity';
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
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findById(id: string): Promise<Event | null> {
    return this.eventsRepository.findOne({
      where: { id },
      relations: { era: true, tags: true },
    });
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
    return tags;
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
      era,
      tags,
    });

    return this.eventsRepository.save(event);
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

    if (query.startYear) {
      queryBuilder.andWhere('event.startYear ILIKE :startYear', {
        startYear: `%${query.startYear}%`,
      });
    }

    if (query.endYear) {
      queryBuilder.andWhere('event.endYear ILIKE :endYear', {
        endYear: `%${query.endYear}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['event.id', 'event.name'])
      .orderBy('event.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const events = await this.eventsRepository.find({
      where: { id: In(ids.map((event) => event.id)) },
      relations: { era: true, tags: true },
    });

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

    if (dto.tagIds !== undefined) {
      event.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.eventsRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Evento não encontrado.');
    }
  }
}
