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
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
