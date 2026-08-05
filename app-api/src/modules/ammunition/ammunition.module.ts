import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ammunition } from './entities/ammunition.entity';
import { AmmunitionTag } from './entities/ammunition-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { AmmunitionController } from './ammunition.controller';
import { AmmunitionService } from './ammunition.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ammunition, AmmunitionTag, Tag, Currency]),
  ],
  controllers: [AmmunitionController],
  providers: [AmmunitionService],
  exports: [AmmunitionService],
})
export class AmmunitionModule {}
