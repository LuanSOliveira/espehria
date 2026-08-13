import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trait } from './entities/trait.entity';
import { TraitTag } from './entities/trait-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TraitType } from '../trait-types/entities/trait-type.entity';
import { TraitsController } from './traits.controller';
import { TraitsService } from './traits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trait, TraitTag, Tag, TraitType])],
  controllers: [TraitsController],
  providers: [TraitsService],
  exports: [TraitsService],
})
export class TraitsModule {}
