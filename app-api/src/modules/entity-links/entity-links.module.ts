import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityLink } from './entities/entity-link.entity';
import { Training } from '../trainings/entities/training.entity';
import { Talent } from '../talents/entities/talent.entity';
import { Technique } from '../techniques/entities/technique.entity';
import { Spell } from '../spells/entities/spell.entity';
import { Characteristic } from '../characteristics/entities/characteristic.entity';
import { Biography } from '../biographies/entities/biography.entity';
import { EntityLinksService } from './entity-links.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntityLink,
      Training,
      Talent,
      Technique,
      Spell,
      Characteristic,
      Biography,
    ]),
  ],
  providers: [EntityLinksService],
  exports: [EntityLinksService],
})
export class EntityLinksModule {}
