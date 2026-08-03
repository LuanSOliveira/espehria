import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImprovementFlawProperty } from './entities/improvement-flaw-property.entity';
import { ImprovementFlawPropertiesController } from './improvement-flaw-properties.controller';
import { ImprovementFlawPropertiesService } from './improvement-flaw-properties.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImprovementFlawProperty])],
  controllers: [ImprovementFlawPropertiesController],
  providers: [ImprovementFlawPropertiesService],
  exports: [ImprovementFlawPropertiesService],
})
export class ImprovementFlawPropertiesModule {}
