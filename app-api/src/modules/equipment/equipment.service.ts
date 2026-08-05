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
import {
  createOrderedTagJunctions,
  loadOrderedTagsForOwner,
  loadOrderedTagsMap,
  replaceOrderedTagJunctions,
} from '../../common/utils/ordered-tags.util';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FindEquipmentQueryDto } from './dto/find-equipment-query.dto';
import { Equipment } from './entities/equipment.entity';
import { EquipmentTag } from './entities/equipment-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';

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
    @InjectRepository(EquipmentTag)
    private readonly equipmentTagsRepository: Repository<EquipmentTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  findByName(name: string): Promise<Equipment | null> {
    return this.equipmentRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Equipment | null> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
      relations: { currency: true },
    });
    if (!equipment) {
      return null;
    }
    equipment.tags = await loadOrderedTagsForOwner(
      this.equipmentTagsRepository,
      id,
      'equipment',
    );
    return equipment;
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    return uniqueIds.map((id) => tagsById.get(id)!);
  }

  private async findCurrencyById(currencyId: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOneBy({
      id: currencyId,
    });
    if (!currency) {
      throw new NotFoundException('Moeda não encontrada.');
    }
    return currency;
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

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const equipment = this.equipmentRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
    });

    const savedEquipment = await this.equipmentRepository.save(equipment);
    await createOrderedTagJunctions(
      this.equipmentTagsRepository,
      'equipment',
      savedEquipment,
      tags,
    );
    savedEquipment.tags = tags;
    return savedEquipment;
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
      relations: { currency: true },
      order: { name: 'ASC' },
    });

    const tagsByEquipmentId = await loadOrderedTagsMap(
      this.equipmentTagsRepository,
      equipmentList.map((item) => item.id),
      'equipment',
    );
    for (const item of equipmentList) {
      item.tags = tagsByEquipmentId.get(item.id) ?? [];
    }

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
    if (dto.price === null) {
      equipment.currency = null;
    } else if (dto.currencyId !== undefined) {
      equipment.currency = await this.findCurrencyById(dto.currencyId);
    }
    if (dto.privateInformation !== undefined) {
      equipment.privateInformation = dto.privateInformation;
    }
    let tags = equipment.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.equipmentTagsRepository,
        'equipment',
        equipment,
        tags,
      );
    }

    const savedEquipment = await this.equipmentRepository.save(equipment);
    savedEquipment.tags = tags;
    return savedEquipment;
  }

  async remove(id: string): Promise<void> {
    const result = await this.equipmentRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Equipamento não encontrado.');
    }
  }
}
