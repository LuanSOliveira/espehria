import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImprovementFlawProperty } from './entities/improvement-flaw-property.entity';

@Injectable()
export class ImprovementFlawPropertiesService {
  constructor(
    @InjectRepository(ImprovementFlawProperty)
    private readonly improvementFlawPropertiesRepository: Repository<ImprovementFlawProperty>,
  ) {}

  findAll(): Promise<ImprovementFlawProperty[]> {
    return this.improvementFlawPropertiesRepository.find({
      relations: { type: true },
      order: { name: 'ASC' },
    });
  }
}
