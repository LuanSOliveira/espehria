import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImprovementFlaw } from './entities/improvement-flaw.entity';
import { ImprovementFlawType } from '../improvement-flaw-types/entities/improvement-flaw-type.entity';
import { ImprovementFlawProperty } from '../improvement-flaw-properties/entities/improvement-flaw-property.entity';
import { ImprovementFlawsService } from './improvement-flaws.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImprovementFlaw,
      ImprovementFlawType,
      ImprovementFlawProperty,
    ]),
  ],
  providers: [ImprovementFlawsService],
  exports: [ImprovementFlawsService],
})
export class ImprovementFlawsModule {}
