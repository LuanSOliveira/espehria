import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Creature } from '../creatures/entities/creature.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Creature])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
