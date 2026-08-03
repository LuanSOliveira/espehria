import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImprovementFlawType } from './entities/improvement-flaw-type.entity';

@Injectable()
export class ImprovementFlawTypesService {
  constructor(
    @InjectRepository(ImprovementFlawType)
    private readonly improvementFlawTypesRepository: Repository<ImprovementFlawType>,
  ) {}

  findAll(): Promise<ImprovementFlawType[]> {
    return this.improvementFlawTypesRepository.find({
      order: { name: 'ASC' },
    });
  }
}
