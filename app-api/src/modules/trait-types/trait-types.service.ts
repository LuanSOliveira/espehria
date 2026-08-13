import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TraitType } from './entities/trait-type.entity';

@Injectable()
export class TraitTypesService {
  constructor(
    @InjectRepository(TraitType)
    private readonly traitTypesRepository: Repository<TraitType>,
  ) {}

  findAll(): Promise<TraitType[]> {
    return this.traitTypesRepository.find({ order: { name: 'ASC' } });
  }
}
