import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shield } from './entities/shield.entity';
import { ShieldTag } from './entities/shield-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { ShieldsController } from './shields.controller';
import { ShieldsService } from './shields.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shield, ShieldTag, Tag, Currency])],
  controllers: [ShieldsController],
  providers: [ShieldsService],
  exports: [ShieldsService],
})
export class ShieldsModule {}
