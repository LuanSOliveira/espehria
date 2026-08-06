import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from './entities/race.entity';
import { RaceTag } from './entities/race-tag.entity';
import { RaceCategory } from './entities/race-category.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Characteristic } from '../characteristics/entities/characteristic.entity';
import { CharacteristicTag } from '../characteristics/entities/characteristic-tag.entity';
import { Talent } from '../talents/entities/talent.entity';
import { TalentTag } from '../talents/entities/talent-tag.entity';
import { ImprovementFlawsModule } from '../improvement-flaws/improvement-flaws.module';
import { ProficienciesModule } from '../proficiencies/proficiencies.module';
import { KnowledgesModule } from '../knowledges/knowledges.module';
import { RacesController } from './races.controller';
import { RacesService } from './races.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Race,
      RaceTag,
      RaceCategory,
      Tag,
      Characteristic,
      CharacteristicTag,
      Talent,
      TalentTag,
    ]),
    ImprovementFlawsModule,
    ProficienciesModule,
    KnowledgesModule,
  ],
  controllers: [RacesController],
  providers: [RacesService],
  exports: [RacesService],
})
export class RacesModule {}
