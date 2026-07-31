import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from './entities/attribute.entity';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributesRepository: Repository<Attribute>,
  ) {}

  findAll(): Promise<Attribute[]> {
    return this.attributesRepository.find({ order: { name: 'ASC' } });
  }
}
