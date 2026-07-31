import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { Utility } from '../utilities/entities/utility.entity';
import { Training } from '../trainings/entities/training.entity';
import { Talent } from '../talents/entities/talent.entity';
import { Technique } from '../techniques/entities/technique.entity';
import { Spell } from '../spells/entities/spell.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { PlannedSession } from '../planned-sessions/entities/planned-session.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Creature,
      Tag,
      Location,
      Race,
      Era,
      Event,
      Divinity,
      Character,
      Organization,
      Family,
      Equipment,
      Material,
      Consumable,
      Ammunition,
      Rule,
      Skill,
      Condition,
      Utility,
      Training,
      Talent,
      Technique,
      Spell,
      Campaign,
      PlannedSession,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
