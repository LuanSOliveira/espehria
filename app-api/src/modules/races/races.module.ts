import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from './entities/race.entity';
import { RaceCategory } from './entities/race-category.entity';
import { Tag } from '../tags/entities/tag.entity';
import { RacesController } from './races.controller';
import { RacesService } from './races.service';

@Module({
  imports: [TypeOrmModule.forFeature([Race, RaceCategory, Tag])],
  controllers: [RacesController],
  providers: [RacesService],
  exports: [RacesService],
})
export class RacesModule {}
