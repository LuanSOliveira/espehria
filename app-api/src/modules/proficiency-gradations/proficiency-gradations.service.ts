import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProficiencyGradation } from './entities/proficiency-gradation.entity';

@Injectable()
export class ProficiencyGradationsService {
  constructor(
    @InjectRepository(ProficiencyGradation)
    private readonly proficiencyGradationsRepository: Repository<ProficiencyGradation>,
  ) {}

  findAll(): Promise<ProficiencyGradation[]> {
    return this.proficiencyGradationsRepository.find({
      order: { level: 'ASC' },
    });
  }
}
