import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from './entities/equipment.entity';
import { Tag } from '../tags/entities/tag.entity';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, Tag])],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
