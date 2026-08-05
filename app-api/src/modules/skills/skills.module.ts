import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { SkillSection } from './entities/skill-section.entity';
import { SkillTag } from './entities/skill-tag.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Tag } from '../tags/entities/tag.entity';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Skill,
      SkillSection,
      SkillTag,
      Attribute,
      Tag,
    ]),
  ],
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
