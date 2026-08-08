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
import { CreateWeaponDto } from './dto/create-weapon.dto';
import { UpdateWeaponDto } from './dto/update-weapon.dto';
import { FindWeaponsQueryDto } from './dto/find-weapons-query.dto';
import { Weapon } from './entities/weapon.entity';
import { WeaponTag } from './entities/weapon-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';

export interface PaginatedWeapons {
  data: Weapon[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class WeaponsService {
  constructor(
    @InjectRepository(Weapon)
    private readonly weaponsRepository: Repository<Weapon>,
    @InjectRepository(WeaponTag)
    private readonly weaponTagsRepository: Repository<WeaponTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  findByName(name: string): Promise<Weapon | null> {
    return this.weaponsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Weapon | null> {
    const weapon = await this.weaponsRepository.findOne({
      where: { id },
      relations: { currency: true },
    });
    if (!weapon) {
      return null;
    }
    weapon.tags = await loadOrderedTagsForOwner(
      this.weaponTagsRepository,
      id,
      'weapon',
    );
    return weapon;
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

  async create(dto: CreateWeaponDto): Promise<Weapon> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma arma com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const weapon = this.weaponsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
    });

    const savedWeapon = await this.weaponsRepository.save(weapon);
    await createOrderedTagJunctions(
      this.weaponTagsRepository,
      'weapon',
      savedWeapon,
      tags,
    );
    savedWeapon.tags = tags;
    return savedWeapon;
  }

  async findAllPaginated(
    query: FindWeaponsQueryDto,
  ): Promise<PaginatedWeapons> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.weaponsRepository.createQueryBuilder('weapon');

    if (query.name) {
      queryBuilder.andWhere('weapon.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['weapon.id', 'weapon.name'])
      .orderBy('weapon.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const weapons = await this.weaponsRepository.find({
      where: { id: In(ids.map((weapon) => weapon.id)) },
      relations: { currency: true },
      order: { name: 'ASC' },
    });

    const tagsByWeaponId = await loadOrderedTagsMap(
      this.weaponTagsRepository,
      weapons.map((weapon) => weapon.id),
      'weapon',
    );
    for (const weapon of weapons) {
      weapon.tags = tagsByWeaponId.get(weapon.id) ?? [];
    }

    const weaponsById = new Map(weapons.map((weapon) => [weapon.id, weapon]));
    const data = ids
      .map((weapon) => weaponsById.get(weapon.id))
      .filter((weapon): weapon is Weapon => weapon !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateWeaponDto): Promise<Weapon> {
    const weapon = await this.findById(id);
    if (!weapon) {
      throw new NotFoundException('Arma não encontrada.');
    }

    if (dto.name && dto.name !== weapon.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma arma com este nome.');
      }
      weapon.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      weapon.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      weapon.description = dto.description;
    }
    if (dto.price !== undefined) {
      weapon.price = dto.price;
    }
    if (dto.price === null) {
      weapon.currency = null;
    } else if (dto.currencyId !== undefined) {
      weapon.currency = await this.findCurrencyById(dto.currencyId);
    }
    if (dto.privateInformation !== undefined) {
      weapon.privateInformation = dto.privateInformation;
    }
    let tags = weapon.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.weaponTagsRepository,
        'weapon',
        weapon,
        tags,
      );
    }

    const savedWeapon = await this.weaponsRepository.save(weapon);
    savedWeapon.tags = tags;
    return savedWeapon;
  }

  async remove(id: string): Promise<void> {
    const result = await this.weaponsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Arma não encontrada.');
    }
  }
}
