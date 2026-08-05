import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProficiencyProperty } from './entities/proficiency-property.entity';

@Injectable()
export class ProficiencyPropertiesService {
  constructor(
    @InjectRepository(ProficiencyProperty)
    private readonly proficiencyPropertiesRepository: Repository<ProficiencyProperty>,
  ) {}

  findAll(): Promise<ProficiencyProperty[]> {
    return this.proficiencyPropertiesRepository.find({
      order: { name: 'ASC' },
    });
  }
}
