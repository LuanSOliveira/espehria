import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImprovementFlawType } from './entities/improvement-flaw-type.entity';
import { ImprovementFlawTypesController } from './improvement-flaw-types.controller';
import { ImprovementFlawTypesService } from './improvement-flaw-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImprovementFlawType])],
  controllers: [ImprovementFlawTypesController],
  providers: [ImprovementFlawTypesService],
  exports: [ImprovementFlawTypesService],
})
export class ImprovementFlawTypesModule {}
