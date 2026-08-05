import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Condition } from './entities/condition.entity';
import { ConditionSection } from './entities/condition-section.entity';
import { ConditionTag } from './entities/condition-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ConditionsController } from './conditions.controller';
import { ConditionsService } from './conditions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Condition, ConditionSection, ConditionTag, Tag]),
  ],
  controllers: [ConditionsController],
  providers: [ConditionsService],
  exports: [ConditionsService],
})
export class ConditionsModule {}
