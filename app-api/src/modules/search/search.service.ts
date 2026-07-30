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
import { Character } from '../characters/entities/character.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Family } from '../families/entities/family.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Material } from '../materials/entities/material.entity';
import { Consumable } from '../consumables/entities/consumable.entity';
import { Ammunition } from '../ammunition/entities/ammunition.entity';
import { Rule } from '../rules/entities/rule.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Condition } from '../conditions/entities/condition.entity';
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
    @InjectRepository(Character)
    private readonly charactersRepository: Repository<Character>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(Material)
    private readonly materialsRepository: Repository<Material>,
    @InjectRepository(Consumable)
    private readonly consumablesRepository: Repository<Consumable>,
    @InjectRepository(Ammunition)
    private readonly ammunitionRepository: Repository<Ammunition>,
    @InjectRepository(Rule)
    private readonly rulesRepository: Repository<Rule>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(Condition)
    private readonly conditionsRepository: Repository<Condition>,
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
      {
        entityType: LinkableEntityType.CHARACTER,
        repository: this.charactersRepository,
      },
      {
        entityType: LinkableEntityType.ORGANIZATION,
        repository: this.organizationsRepository,
      },
      {
        entityType: LinkableEntityType.FAMILY,
        repository: this.familiesRepository,
      },
      {
        entityType: LinkableEntityType.EQUIPMENT,
        repository: this.equipmentRepository,
      },
      {
        entityType: LinkableEntityType.MATERIAL,
        repository: this.materialsRepository,
      },
      {
        entityType: LinkableEntityType.CONSUMABLE,
        repository: this.consumablesRepository,
      },
      {
        entityType: LinkableEntityType.AMMUNITION,
        repository: this.ammunitionRepository,
      },
      {
        entityType: LinkableEntityType.RULE,
        repository: this.rulesRepository,
      },
      {
        entityType: LinkableEntityType.SKILL,
        repository: this.skillsRepository,
      },
      {
        entityType: LinkableEntityType.CONDITION,
        repository: this.conditionsRepository,
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
