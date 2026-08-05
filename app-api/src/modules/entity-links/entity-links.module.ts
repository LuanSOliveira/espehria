import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityLink } from './entities/entity-link.entity';
import { Training } from '../trainings/entities/training.entity';
import { TrainingTag } from '../trainings/entities/training-tag.entity';
import { Talent } from '../talents/entities/talent.entity';
import { TalentTag } from '../talents/entities/talent-tag.entity';
import { Technique } from '../techniques/entities/technique.entity';
import { TechniqueTag } from '../techniques/entities/technique-tag.entity';
import { Spell } from '../spells/entities/spell.entity';
import { SpellTag } from '../spells/entities/spell-tag.entity';
import { Characteristic } from '../characteristics/entities/characteristic.entity';
import { CharacteristicTag } from '../characteristics/entities/characteristic-tag.entity';
import { Biography } from '../biographies/entities/biography.entity';
import { BiographyTag } from '../biographies/entities/biography-tag.entity';
import { EntityLinksService } from './entity-links.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntityLink,
      Training,
      TrainingTag,
      Talent,
      TalentTag,
      Technique,
      TechniqueTag,
      Spell,
      SpellTag,
      Characteristic,
      CharacteristicTag,
      Biography,
      BiographyTag,
    ]),
  ],
  providers: [EntityLinksService],
  exports: [EntityLinksService],
})
export class EntityLinksModule {}
