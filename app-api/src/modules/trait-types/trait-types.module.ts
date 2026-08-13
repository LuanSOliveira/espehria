import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TraitType } from './entities/trait-type.entity';
import { TraitTypesController } from './trait-types.controller';
import { TraitTypesService } from './trait-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([TraitType])],
  controllers: [TraitTypesController],
  providers: [TraitTypesService],
  exports: [TraitTypesService],
})
export class TraitTypesModule {}
