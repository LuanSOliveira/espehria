import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuthProvider } from '../users/enums/auth-provider.enum';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { PlannedSession } from '../planned-sessions/entities/planned-session.entity';
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
import { Weapon } from '../weapons/entities/weapon.entity';
import { Armor } from '../armors/entities/armor.entity';
import { Accessory } from '../accessories/entities/accessory.entity';
import { Shield } from '../shields/entities/shield.entity';
import { Material } from '../materials/entities/material.entity';
import { Consumable } from '../consumables/entities/consumable.entity';
import { Ammunition } from '../ammunition/entities/ammunition.entity';
import { Rule } from '../rules/entities/rule.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Condition } from '../conditions/entities/condition.entity';
import { Utility } from '../utilities/entities/utility.entity';
import { Training } from '../trainings/entities/training.entity';
import { Talent } from '../talents/entities/talent.entity';
import { Technique } from '../techniques/entities/technique.entity';
import { Spell } from '../spells/entities/spell.entity';
import { Characteristic } from '../characteristics/entities/characteristic.entity';
import { Biography } from '../biographies/entities/biography.entity';
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
    @InjectRepository(Weapon)
    private readonly weaponsRepository: Repository<Weapon>,
    @InjectRepository(Armor)
    private readonly armorsRepository: Repository<Armor>,
    @InjectRepository(Accessory)
    private readonly accessoriesRepository: Repository<Accessory>,
    @InjectRepository(Shield)
    private readonly shieldsRepository: Repository<Shield>,
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
    @InjectRepository(Utility)
    private readonly utilitiesRepository: Repository<Utility>,
    @InjectRepository(Training)
    private readonly trainingsRepository: Repository<Training>,
    @InjectRepository(Talent)
    private readonly talentsRepository: Repository<Talent>,
    @InjectRepository(Technique)
    private readonly techniquesRepository: Repository<Technique>,
    @InjectRepository(Spell)
    private readonly spellsRepository: Repository<Spell>,
    @InjectRepository(Characteristic)
    private readonly characteristicsRepository: Repository<Characteristic>,
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    @InjectRepository(PlannedSession)
    private readonly plannedSessionsRepository: Repository<PlannedSession>,
    @InjectRepository(Biography)
    private readonly biographiesRepository: Repository<Biography>,
  ) {}

  async search(
    query: string,
    currentUser: User,
  ): Promise<SearchResultItemResponseDto[]> {
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
        entityType: LinkableEntityType.WEAPON,
        repository: this.weaponsRepository,
      },
      {
        entityType: LinkableEntityType.ARMOR,
        repository: this.armorsRepository,
      },
      {
        entityType: LinkableEntityType.ACCESSORY,
        repository: this.accessoriesRepository,
      },
      {
        entityType: LinkableEntityType.SHIELD,
        repository: this.shieldsRepository,
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
      {
        entityType: LinkableEntityType.UTILITY,
        repository: this.utilitiesRepository,
      },
      {
        entityType: LinkableEntityType.TRAINING,
        repository: this.trainingsRepository,
      },
      {
        entityType: LinkableEntityType.TALENT,
        repository: this.talentsRepository,
      },
      {
        entityType: LinkableEntityType.TECHNIQUE,
        repository: this.techniquesRepository,
      },
      {
        entityType: LinkableEntityType.SPELL,
        repository: this.spellsRepository,
      },
      {
        entityType: LinkableEntityType.CHARACTERISTIC,
        repository: this.characteristicsRepository,
      },
      {
        entityType: LinkableEntityType.CAMPAIGN,
        repository: this.campaignsRepository,
      },
      {
        entityType: LinkableEntityType.PLANNED_SESSION,
        repository: this.plannedSessionsRepository,
      },
      {
        entityType: LinkableEntityType.BIOGRAPHY,
        repository: this.biographiesRepository,
      },
    ];

    // Campanhas e sessões planejadas são recursos privados do dono (ver
    // CampaignsService/PlannedSessionsService) — usuários Google são bloqueados
    // desses recursos por completo, então nem aparecem como resultado de busca.
    const searchableEntities =
      currentUser.provider === AuthProvider.GOOGLE
        ? linkableEntities.filter(
            ({ entityType }) =>
              entityType !== LinkableEntityType.CAMPAIGN &&
              entityType !== LinkableEntityType.PLANNED_SESSION,
          )
        : linkableEntities;

    const results: SearchResultItemResponseDto[] = [];

    for (const { entityType, repository } of searchableEntities) {
      const queryBuilder = repository
        .createQueryBuilder('entity')
        .where('entity.name ILIKE :query', { query: `%${query}%` });

      if (entityType === LinkableEntityType.CAMPAIGN) {
        queryBuilder.andWhere('entity.createdBy = :userId', {
          userId: currentUser.id,
        });
      } else if (entityType === LinkableEntityType.PLANNED_SESSION) {
        queryBuilder
          .leftJoin('entity.campaign', 'campaign')
          .andWhere('campaign.createdBy = :userId', {
            userId: currentUser.id,
          });
      }

      const rows = await queryBuilder
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
