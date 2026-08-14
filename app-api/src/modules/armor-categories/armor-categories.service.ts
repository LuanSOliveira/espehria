import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArmorCategory } from './entities/armor-category.entity';

@Injectable()
export class ArmorCategoriesService {
  constructor(
    @InjectRepository(ArmorCategory)
    private readonly armorCategoriesRepository: Repository<ArmorCategory>,
  ) {}

  findAll(): Promise<ArmorCategory[]> {
    return this.armorCategoriesRepository.find({ order: { order: 'ASC' } });
  }
}
