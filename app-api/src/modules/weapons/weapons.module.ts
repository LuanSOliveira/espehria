import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Weapon } from './entities/weapon.entity';
import { WeaponTag } from './entities/weapon-tag.entity';
import { WeaponTrait } from './entities/weapon-trait.entity';
import { WeaponAlternativeDamage } from './entities/weapon-alternative-damage.entity';
import { WeaponExtraDamage } from './entities/weapon-extra-damage.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { SizeGrade } from '../size-grades/entities/size-grade.entity';
import { DamageType } from '../damage-types/entities/damage-type.entity';
import { Trait } from '../traits/entities/trait.entity';
import { WeaponsController } from './weapons.controller';
import { WeaponsService } from './weapons.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Weapon,
      WeaponTag,
      WeaponTrait,
      WeaponAlternativeDamage,
      WeaponExtraDamage,
      Tag,
      Currency,
      SizeGrade,
      DamageType,
      Trait,
    ]),
  ],
  controllers: [WeaponsController],
  providers: [WeaponsService],
  exports: [WeaponsService],
})
export class WeaponsModule {}
