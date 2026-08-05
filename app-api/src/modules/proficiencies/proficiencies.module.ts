import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proficiency } from './entities/proficiency.entity';
import { ProficiencyProperty } from '../proficiency-properties/entities/proficiency-property.entity';
import { ProficiencyGradation } from '../proficiency-gradations/entities/proficiency-gradation.entity';
import { ProficienciesService } from './proficiencies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proficiency,
      ProficiencyProperty,
      ProficiencyGradation,
    ]),
  ],
  providers: [ProficienciesService],
  exports: [ProficienciesService],
})
export class ProficienciesModule {}
