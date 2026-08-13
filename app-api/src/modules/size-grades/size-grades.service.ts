import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SizeGrade } from './entities/size-grade.entity';

@Injectable()
export class SizeGradesService {
  constructor(
    @InjectRepository(SizeGrade)
    private readonly sizeGradesRepository: Repository<SizeGrade>,
  ) {}

  findAll(): Promise<SizeGrade[]> {
    return this.sizeGradesRepository.find({ order: { order: 'ASC' } });
  }
}
