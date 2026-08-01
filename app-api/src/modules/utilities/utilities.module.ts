import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Utility } from './entities/utility.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { UtilitiesController } from './utilities.controller';
import { UtilitiesService } from './utilities.service';

@Module({
  imports: [TypeOrmModule.forFeature([Utility, Tag, Currency])],
  controllers: [UtilitiesController],
  providers: [UtilitiesService],
  exports: [UtilitiesService],
})
export class UtilitiesModule {}
