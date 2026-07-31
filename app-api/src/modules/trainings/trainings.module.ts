import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Training } from './entities/training.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TrainingsController } from './trainings.controller';
import { TrainingsService } from './trainings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Training, Tag])],
  controllers: [TrainingsController],
  providers: [TrainingsService],
  exports: [TrainingsService],
})
export class TrainingsModule {}
