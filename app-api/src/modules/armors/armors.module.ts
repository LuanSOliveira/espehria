import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Armor } from './entities/armor.entity';
import { ArmorTag } from './entities/armor-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { ArmorsController } from './armors.controller';
import { ArmorsService } from './armors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Armor, ArmorTag, Tag, Currency])],
  controllers: [ArmorsController],
  providers: [ArmorsService],
  exports: [ArmorsService],
})
export class ArmorsModule {}
