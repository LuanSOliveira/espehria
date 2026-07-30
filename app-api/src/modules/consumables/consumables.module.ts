import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consumable } from './entities/consumable.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ConsumablesController } from './consumables.controller';
import { ConsumablesService } from './consumables.service';

@Module({
  imports: [TypeOrmModule.forFeature([Consumable, Tag])],
  controllers: [ConsumablesController],
  providers: [ConsumablesService],
  exports: [ConsumablesService],
})
export class ConsumablesModule {}
