import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spell } from './entities/spell.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EntityLinksModule } from '../entity-links/entity-links.module';
import { SpellsController } from './spells.controller';
import { SpellsService } from './spells.service';

@Module({
  imports: [TypeOrmModule.forFeature([Spell, Tag]), EntityLinksModule],
  controllers: [SpellsController],
  providers: [SpellsService],
  exports: [SpellsService],
})
export class SpellsModule {}
