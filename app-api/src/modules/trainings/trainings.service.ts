import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { FindTrainingsQueryDto } from './dto/find-trainings-query.dto';
import { Training } from './entities/training.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedTrainings {
  data: Training[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class TrainingsService {
  constructor(
    @InjectRepository(Training)
    private readonly trainingsRepository: Repository<Training>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Training | null> {
    return this.trainingsRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Training | null> {
    return this.trainingsRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  async create(dto: CreateTrainingDto): Promise<Training> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um treinamento com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const training = this.trainingsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      tags,
    });

    return this.trainingsRepository.save(training);
  }

  async findAllPaginated(
    query: FindTrainingsQueryDto,
  ): Promise<PaginatedTrainings> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.trainingsRepository.createQueryBuilder('training');

    if (query.name) {
      queryBuilder.andWhere('training.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['training.id', 'training.name'])
      .orderBy('training.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const trainings = await this.trainingsRepository.find({
      where: { id: In(ids.map((training) => training.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const trainingsById = new Map(
      trainings.map((training) => [training.id, training]),
    );
    const data = ids
      .map((training) => trainingsById.get(training.id))
      .filter((training): training is Training => training !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateTrainingDto): Promise<Training> {
    const training = await this.findById(id);
    if (!training) {
      throw new NotFoundException('Treinamento não encontrado.');
    }

    if (dto.name && dto.name !== training.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException(
          'Já existe um treinamento com este nome.',
        );
      }
      training.name = dto.name;
    }

    if (dto.description !== undefined) {
      training.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      training.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.trainingsRepository.save(training);
  }

  async remove(id: string): Promise<void> {
    const result = await this.trainingsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Treinamento não encontrado.');
    }
  }
}
