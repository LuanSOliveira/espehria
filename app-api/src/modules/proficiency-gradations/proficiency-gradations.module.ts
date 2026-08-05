import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProficiencyGradation } from './entities/proficiency-gradation.entity';
import { ProficiencyGradationsController } from './proficiency-gradations.controller';
import { ProficiencyGradationsService } from './proficiency-gradations.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProficiencyGradation])],
  controllers: [ProficiencyGradationsController],
  providers: [ProficiencyGradationsService],
  exports: [ProficiencyGradationsService],
})
export class ProficiencyGradationsModule {}
