import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Technique } from './entities/technique.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksModule } from '../entity-links/entity-links.module';
import { TechniquesController } from './techniques.controller';
import { TechniquesService } from './techniques.service';

@Module({
  imports: [TypeOrmModule.forFeature([Technique, Tag]), EntityLinksModule],
  controllers: [TechniquesController],
  providers: [TechniquesService],
  exports: [TechniquesService],
})
export class TechniquesModule {}
