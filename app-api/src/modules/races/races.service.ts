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
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import { FindRacesQueryDto } from './dto/find-races-query.dto';
import { Race } from './entities/race.entity';
import { RaceCategory } from './entities/race-category.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedRaces {
  data: Race[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class RacesService {
  constructor(
    @InjectRepository(Race)
    private readonly racesRepository: Repository<Race>,
    @InjectRepository(RaceCategory)
    private readonly raceCategoriesRepository: Repository<RaceCategory>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Race | null> {
    return this.racesRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Race | null> {
    return this.racesRepository.findOne({
      where: { id },
      relations: { category: true, tags: true },
    });
  }

  findCategoryById(id: string): Promise<RaceCategory | null> {
    return this.raceCategoriesRepository.findOneBy({ id });
  }

  findAllCategories(): Promise<RaceCategory[]> {
    return this.raceCategoriesRepository.find({
      order: { name: 'ASC' },
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

  async create(dto: CreateRaceDto): Promise<Race> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma raça com este nome.');
    }

    const category = await this.findCategoryById(dto.categoryId);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const race = this.racesRepository.create({
      name: dto.name,
      category,
      referenceImageUrl: dto.referenceImageUrl ?? null,
      physicalCharacteristics: dto.physicalCharacteristics ?? null,
      description: dto.description ?? null,
      privateInformation: dto.privateInformation ?? null,
      tags,
    });

    return this.racesRepository.save(race);
  }

  async findAllPaginated(query: FindRacesQueryDto): Promise<PaginatedRaces> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.racesRepository
      .createQueryBuilder('race')
      .leftJoin('race.category', 'category');

    if (query.name) {
      queryBuilder.andWhere('race.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('race.category = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['race.id', 'race.name'])
      .orderBy('race.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const races = await this.racesRepository.find({
      where: { id: In(ids.map((race) => race.id)) },
      relations: { category: true, tags: true },
    });

    const racesById = new Map(races.map((race) => [race.id, race]));
    const data = ids
      .map((race) => racesById.get(race.id))
      .filter((race): race is Race => race !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateRaceDto): Promise<Race> {
    const race = await this.findById(id);
    if (!race) {
      throw new NotFoundException('Raça não encontrada.');
    }

    if (dto.name && dto.name !== race.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma raça com este nome.');
      }
      race.name = dto.name;
    }

    if (dto.categoryId && dto.categoryId !== race.category.id) {
      const category = await this.findCategoryById(dto.categoryId);
      if (!category) {
        throw new NotFoundException('Categoria não encontrada.');
      }
      race.category = category;
    }

    if (dto.referenceImageUrl !== undefined) {
      race.referenceImageUrl = dto.referenceImageUrl;
    }
    if (dto.physicalCharacteristics !== undefined) {
      race.physicalCharacteristics = dto.physicalCharacteristics;
    }
    if (dto.description !== undefined) {
      race.description = dto.description;
    }
    if (dto.privateInformation !== undefined) {
      race.privateInformation = dto.privateInformation;
    }
    if (dto.tagIds !== undefined) {
      race.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.racesRepository.save(race);
  }

  async remove(id: string): Promise<void> {
    const result = await this.racesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Raça não encontrada.');
    }
  }
}
