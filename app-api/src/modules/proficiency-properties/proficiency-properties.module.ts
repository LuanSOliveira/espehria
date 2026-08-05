import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProficiencyProperty } from './entities/proficiency-property.entity';
import { ProficiencyPropertiesController } from './proficiency-properties.controller';
import { ProficiencyPropertiesService } from './proficiency-properties.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProficiencyProperty])],
  controllers: [ProficiencyPropertiesController],
  providers: [ProficiencyPropertiesService],
  exports: [ProficiencyPropertiesService],
})
export class ProficiencyPropertiesModule {}
