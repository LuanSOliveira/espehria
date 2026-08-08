import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Weapon } from './entities/weapon.entity';
import { WeaponTag } from './entities/weapon-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { WeaponsController } from './weapons.controller';
import { WeaponsService } from './weapons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Weapon, WeaponTag, Tag, Currency])],
  controllers: [WeaponsController],
  providers: [WeaponsService],
  exports: [WeaponsService],
})
export class WeaponsModule {}
