import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DamageType } from './entities/damage-type.entity';

@Injectable()
export class DamageTypesService {
  constructor(
    @InjectRepository(DamageType)
    private readonly damageTypesRepository: Repository<DamageType>,
  ) {}

  findAll(): Promise<DamageType[]> {
    return this.damageTypesRepository.find({ order: { name: 'ASC' } });
  }
}
