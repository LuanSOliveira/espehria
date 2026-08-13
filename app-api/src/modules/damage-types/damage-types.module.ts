import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DamageType } from './entities/damage-type.entity';
import { DamageTypesController } from './damage-types.controller';
import { DamageTypesService } from './damage-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([DamageType])],
  controllers: [DamageTypesController],
  providers: [DamageTypesService],
  exports: [DamageTypesService],
})
export class DamageTypesModule {}
