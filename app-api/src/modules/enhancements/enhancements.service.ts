import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { CreateEnhancementDto } from './dto/create-enhancement.dto';
import { UpdateEnhancementDto } from './dto/update-enhancement.dto';
import { FindEnhancementsQueryDto } from './dto/find-enhancements-query.dto';
import { Enhancement } from './entities/enhancement.entity';

export interface PaginatedEnhancements {
  data: Enhancement[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class EnhancementsService {
  constructor(
    @InjectRepository(Enhancement)
    private readonly enhancementsRepository: Repository<Enhancement>,
  ) {}

  findByName(name: string): Promise<Enhancement | null> {
    return this.enhancementsRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Enhancement | null> {
    return this.enhancementsRepository.findOneBy({ id });
  }

  async create(dto: CreateEnhancementDto): Promise<Enhancement> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um aprimoramento com este nome.');
    }

    const enhancement = this.enhancementsRepository.create({
      name: dto.name,
      type: dto.type ?? null,
      effect: dto.effect ?? null,
    });

    return this.enhancementsRepository.save(enhancement);
  }

  async findAllPaginated(
    query: FindEnhancementsQueryDto,
  ): Promise<PaginatedEnhancements> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.enhancementsRepository.createQueryBuilder('enhancement');

    if (query.name) {
      queryBuilder.andWhere('enhancement.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('enhancement.type = :type', {
        type: query.type,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('enhancement.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateEnhancementDto): Promise<Enhancement> {
    const enhancement = await this.findById(id);
    if (!enhancement) {
      throw new NotFoundException('Aprimoramento não encontrado.');
    }

    if (dto.name && dto.name !== enhancement.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException(
          'Já existe um aprimoramento com este nome.',
        );
      }
      enhancement.name = dto.name;
    }

    if (dto.type !== undefined) {
      enhancement.type = dto.type;
    }
    if (dto.effect !== undefined) {
      enhancement.effect = dto.effect;
    }

    return this.enhancementsRepository.save(enhancement);
  }

  async remove(id: string): Promise<void> {
    const result = await this.enhancementsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Aprimoramento não encontrado.');
    }
  }
}
