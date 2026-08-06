import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Biography } from './entities/biography.entity';
import { BiographyTag } from './entities/biography-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksModule } from '../entity-links/entity-links.module';
import { ImprovementFlawsModule } from '../improvement-flaws/improvement-flaws.module';
import { ProficienciesModule } from '../proficiencies/proficiencies.module';
import { KnowledgesModule } from '../knowledges/knowledges.module';
import { BiographiesController } from './biographies.controller';
import { BiographiesService } from './biographies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Biography, BiographyTag, Tag]),
    EntityLinksModule,
    ImprovementFlawsModule,
    ProficienciesModule,
    KnowledgesModule,
  ],
  controllers: [BiographiesController],
  providers: [BiographiesService],
  exports: [BiographiesService],
})
export class BiographiesModule {}
