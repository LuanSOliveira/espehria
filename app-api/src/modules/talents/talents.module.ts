import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Talent } from './entities/talent.entity';
import { TalentTag } from './entities/talent-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksModule } from '../entity-links/entity-links.module';
import { ImprovementFlawsModule } from '../improvement-flaws/improvement-flaws.module';
import { ProficienciesModule } from '../proficiencies/proficiencies.module';
import { TalentsController } from './talents.controller';
import { TalentsService } from './talents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Talent, TalentTag, Tag]),
    EntityLinksModule,
    ImprovementFlawsModule,
    ProficienciesModule,
  ],
  controllers: [TalentsController],
  providers: [TalentsService],
  exports: [TalentsService],
})
export class TalentsModule {}
