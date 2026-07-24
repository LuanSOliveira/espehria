import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Creature } from '../creatures/entities/creature.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Location } from '../locations/entities/location.entity';
import { Race } from '../races/entities/race.entity';
import { Era } from '../eras/entities/era.entity';
import { Event } from '../events/entities/event.entity';
import { Divinity } from '../divinities/entities/divinity.entity';
import { LinkableEntityType } from './enums/linkable-entity-type.enum';
import { SearchResultItemResponseDto } from './dto/search-result-item-response.dto';

const MAX_RESULTS = 10;

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Creature)
    private readonly creaturesRepository: Repository<Creature>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Location)
    private readonly locationsRepository: Repository<Location>,
    @InjectRepository(Race)
    private readonly racesRepository: Repository<Race>,
    @InjectRepository(Era)
    private readonly erasRepository: Repository<Era>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Divinity)
    private readonly divinitiesRepository: Repository<Divinity>,
  ) {}

  async search(query: string): Promise<SearchResultItemResponseDto[]> {
    const linkableEntities = [
      { entityType: LinkableEntityType.USER, repository: this.usersRepository },
      {
        entityType: LinkableEntityType.CREATURE,
        repository: this.creaturesRepository,
      },
      { entityType: LinkableEntityType.TAG, repository: this.tagsRepository },
      {
        entityType: LinkableEntityType.LOCATION,
        repository: this.locationsRepository,
      },
      { entityType: LinkableEntityType.RACE, repository: this.racesRepository },
      { entityType: LinkableEntityType.ERA, repository: this.erasRepository },
      {
        entityType: LinkableEntityType.EVENT,
        repository: this.eventsRepository,
      },
      {
        entityType: LinkableEntityType.DIVINITY,
        repository: this.divinitiesRepository,
      },
    ];

    const results: SearchResultItemResponseDto[] = [];

    for (const { entityType, repository } of linkableEntities) {
      const rows = await repository
        .createQueryBuilder('entity')
        .where('entity.name ILIKE :query', { query: `%${query}%` })
        .orderBy('entity.name', 'ASC')
        .take(MAX_RESULTS)
        .getMany();

      results.push(
        ...rows.map((row) =>
          SearchResultItemResponseDto.fromEntity(row, entityType),
        ),
      );
    }

    return results.slice(0, MAX_RESULTS);
  }
}
