import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Armor } from './entities/armor.entity';
import { ArmorTag } from './entities/armor-tag.entity';
import { ArmorTrait } from './entities/armor-trait.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { ArmorCategory } from '../armor-categories/entities/armor-category.entity';
import { Trait } from '../traits/entities/trait.entity';
import { ArmorsController } from './armors.controller';
import { ArmorsService } from './armors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Armor,
      ArmorTag,
      ArmorTrait,
      Tag,
      Currency,
      ArmorCategory,
      Trait,
    ]),
  ],
  controllers: [ArmorsController],
  providers: [ArmorsService],
  exports: [ArmorsService],
})
export class ArmorsModule {}
