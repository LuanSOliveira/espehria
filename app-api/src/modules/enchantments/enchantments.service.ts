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
import { CreateEnchantmentDto } from './dto/create-enchantment.dto';
import { UpdateEnchantmentDto } from './dto/update-enchantment.dto';
import { FindEnchantmentsQueryDto } from './dto/find-enchantments-query.dto';
import { Enchantment } from './entities/enchantment.entity';

export interface PaginatedEnchantments {
  data: Enchantment[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class EnchantmentsService {
  constructor(
    @InjectRepository(Enchantment)
    private readonly enchantmentsRepository: Repository<Enchantment>,
  ) {}

  findByName(name: string): Promise<Enchantment | null> {
    return this.enchantmentsRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Enchantment | null> {
    return this.enchantmentsRepository.findOneBy({ id });
  }

  async create(dto: CreateEnchantmentDto): Promise<Enchantment> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um encantamento com este nome.');
    }

    const enchantment = this.enchantmentsRepository.create({
      name: dto.name,
      type: dto.type ?? null,
      effect: dto.effect ?? null,
    });

    return this.enchantmentsRepository.save(enchantment);
  }

  async findAllPaginated(
    query: FindEnchantmentsQueryDto,
  ): Promise<PaginatedEnchantments> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.enchantmentsRepository.createQueryBuilder('enchantment');

    if (query.name) {
      queryBuilder.andWhere('enchantment.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('enchantment.type = :type', {
        type: query.type,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('enchantment.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateEnchantmentDto): Promise<Enchantment> {
    const enchantment = await this.findById(id);
    if (!enchantment) {
      throw new NotFoundException('Encantamento não encontrado.');
    }

    if (dto.name && dto.name !== enchantment.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um encantamento com este nome.');
      }
      enchantment.name = dto.name;
    }

    if (dto.type !== undefined) {
      enchantment.type = dto.type;
    }
    if (dto.effect !== undefined) {
      enchantment.effect = dto.effect;
    }

    return this.enchantmentsRepository.save(enchantment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.enchantmentsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Encantamento não encontrado.');
    }
  }
}
