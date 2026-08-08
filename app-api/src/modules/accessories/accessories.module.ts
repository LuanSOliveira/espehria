import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accessory } from './entities/accessory.entity';
import { AccessoryTag } from './entities/accessory-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { AccessoriesController } from './accessories.controller';
import { AccessoriesService } from './accessories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Accessory, AccessoryTag, Tag, Currency]),
  ],
  controllers: [AccessoriesController],
  providers: [AccessoriesService],
  exports: [AccessoriesService],
})
export class AccessoriesModule {}
