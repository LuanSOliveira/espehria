import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Knowledge } from './entities/knowledge.entity';
import { ProficiencyGradation } from '../proficiency-gradations/entities/proficiency-gradation.entity';
import { KnowledgesService } from './knowledges.service';

@Module({
  imports: [TypeOrmModule.forFeature([Knowledge, ProficiencyGradation])],
  providers: [KnowledgesService],
  exports: [KnowledgesService],
})
export class KnowledgesModule {}
