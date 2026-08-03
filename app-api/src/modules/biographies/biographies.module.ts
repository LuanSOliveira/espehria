import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Biography } from './entities/biography.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksModule } from '../entity-links/entity-links.module';
import { ImprovementFlawsModule } from '../improvement-flaws/improvement-flaws.module';
import { BiographiesController } from './biographies.controller';
import { BiographiesService } from './biographies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Biography, Tag]),
    EntityLinksModule,
    ImprovementFlawsModule,
  ],
  controllers: [BiographiesController],
  providers: [BiographiesService],
  exports: [BiographiesService],
})
export class BiographiesModule {}
