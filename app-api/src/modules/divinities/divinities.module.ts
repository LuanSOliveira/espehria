import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Divinity } from './entities/divinity.entity';
import { DivinityCategory } from './entities/divinity-category.entity';
import { Tag } from '../tags/entities/tag.entity';
import { DivinitiesController } from './divinities.controller';
import { DivinitiesService } from './divinities.service';

@Module({
  imports: [TypeOrmModule.forFeature([Divinity, DivinityCategory, Tag])],
  controllers: [DivinitiesController],
  providers: [DivinitiesService],
  exports: [DivinitiesService],
})
export class DivinitiesModule {}
