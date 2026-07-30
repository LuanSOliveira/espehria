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
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FindEquipmentQueryDto } from './dto/find-equipment-query.dto';
import { Equipment } from './entities/equipment.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedEquipment {
  data: Equipment[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Equipment | null> {
    return this.equipmentRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Equipment | null> {
    return this.equipmentRepository.findOne({
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

  async create(dto: CreateEquipmentDto): Promise<Equipment> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um equipamento com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const equipment = this.equipmentRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      privateInformation: dto.privateInformation ?? null,
      tags,
    });

    return this.equipmentRepository.save(equipment);
  }

  async findAllPaginated(
    query: FindEquipmentQueryDto,
  ): Promise<PaginatedEquipment> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.equipmentRepository.createQueryBuilder('equipment');

    if (query.name) {
      queryBuilder.andWhere('equipment.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['equipment.id', 'equipment.name'])
      .orderBy('equipment.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const equipmentList = await this.equipmentRepository.find({
      where: { id: In(ids.map((item) => item.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const equipmentById = new Map(equipmentList.map((item) => [item.id, item]));
    const data = ids
      .map((item) => equipmentById.get(item.id))
      .filter((item): item is Equipment => item !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    const equipment = await this.findById(id);
    if (!equipment) {
      throw new NotFoundException('Equipamento não encontrado.');
    }

    if (dto.name && dto.name !== equipment.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um equipamento com este nome.');
      }
      equipment.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      equipment.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      equipment.description = dto.description;
    }
    if (dto.price !== undefined) {
      equipment.price = dto.price;
    }
    if (dto.privateInformation !== undefined) {
      equipment.privateInformation = dto.privateInformation;
    }
    if (dto.tagIds !== undefined) {
      equipment.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.equipmentRepository.save(equipment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.equipmentRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Equipamento não encontrado.');
    }
  }
}
