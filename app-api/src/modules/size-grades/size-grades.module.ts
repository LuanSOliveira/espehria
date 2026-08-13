import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SizeGrade } from './entities/size-grade.entity';
import { SizeGradesController } from './size-grades.controller';
import { SizeGradesService } from './size-grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([SizeGrade])],
  controllers: [SizeGradesController],
  providers: [SizeGradesService],
  exports: [SizeGradesService],
})
export class SizeGradesModule {}
