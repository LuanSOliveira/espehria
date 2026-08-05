import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Characteristic } from './entities/characteristic.entity';
import { CharacteristicTag } from './entities/characteristic-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksModule } from '../entity-links/entity-links.module';
import { ImprovementFlawsModule } from '../improvement-flaws/improvement-flaws.module';
import { ProficienciesModule } from '../proficiencies/proficiencies.module';
import { CharacteristicsController } from './characteristics.controller';
import { CharacteristicsService } from './characteristics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Characteristic, CharacteristicTag, Tag]),
    EntityLinksModule,
    ImprovementFlawsModule,
    ProficienciesModule,
  ],
  controllers: [CharacteristicsController],
  providers: [CharacteristicsService],
  exports: [CharacteristicsService],
})
export class CharacteristicsModule {}
