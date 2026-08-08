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
import { CreateArmorDto } from './dto/create-armor.dto';
import { UpdateArmorDto } from './dto/update-armor.dto';
import { FindArmorsQueryDto } from './dto/find-armors-query.dto';
import { Armor } from './entities/armor.entity';
import { ArmorTag } from './entities/armor-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';

export interface PaginatedArmors {
  data: Armor[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class ArmorsService {
  constructor(
    @InjectRepository(Armor)
    private readonly armorsRepository: Repository<Armor>,
    @InjectRepository(ArmorTag)
    private readonly armorTagsRepository: Repository<ArmorTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  findByName(name: string): Promise<Armor | null> {
    return this.armorsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Armor | null> {
    const armor = await this.armorsRepository.findOne({
      where: { id },
      relations: { currency: true },
    });
    if (!armor) {
      return null;
    }
    armor.tags = await loadOrderedTagsForOwner(
      this.armorTagsRepository,
      id,
      'armor',
    );
    return armor;
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

  async create(dto: CreateArmorDto): Promise<Armor> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma armadura com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const armor = this.armorsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
    });

    const savedArmor = await this.armorsRepository.save(armor);
    await createOrderedTagJunctions(
      this.armorTagsRepository,
      'armor',
      savedArmor,
      tags,
    );
    savedArmor.tags = tags;
    return savedArmor;
  }

  async findAllPaginated(query: FindArmorsQueryDto): Promise<PaginatedArmors> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.armorsRepository.createQueryBuilder('armor');

    if (query.name) {
      queryBuilder.andWhere('armor.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['armor.id', 'armor.name'])
      .orderBy('armor.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const armors = await this.armorsRepository.find({
      where: { id: In(ids.map((armor) => armor.id)) },
      relations: { currency: true },
      order: { name: 'ASC' },
    });

    const tagsByArmorId = await loadOrderedTagsMap(
      this.armorTagsRepository,
      armors.map((armor) => armor.id),
      'armor',
    );
    for (const armor of armors) {
      armor.tags = tagsByArmorId.get(armor.id) ?? [];
    }

    const armorsById = new Map(armors.map((armor) => [armor.id, armor]));
    const data = ids
      .map((armor) => armorsById.get(armor.id))
      .filter((armor): armor is Armor => armor !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateArmorDto): Promise<Armor> {
    const armor = await this.findById(id);
    if (!armor) {
      throw new NotFoundException('Armadura não encontrada.');
    }

    if (dto.name && dto.name !== armor.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma armadura com este nome.');
      }
      armor.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      armor.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      armor.description = dto.description;
    }
    if (dto.price !== undefined) {
      armor.price = dto.price;
    }
    if (dto.price === null) {
      armor.currency = null;
    } else if (dto.currencyId !== undefined) {
      armor.currency = await this.findCurrencyById(dto.currencyId);
    }
    if (dto.privateInformation !== undefined) {
      armor.privateInformation = dto.privateInformation;
    }
    let tags = armor.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.armorTagsRepository,
        'armor',
        armor,
        tags,
      );
    }

    const savedArmor = await this.armorsRepository.save(armor);
    savedArmor.tags = tags;
    return savedArmor;
  }

  async remove(id: string): Promise<void> {
    const result = await this.armorsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Armadura não encontrada.');
    }
  }
}
