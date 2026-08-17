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
import { WeaponDamageInputDto } from './dto/weapon-damage-input.dto';
import { Weapon } from './entities/weapon.entity';
import { WeaponTag } from './entities/weapon-tag.entity';
import { WeaponTrait } from './entities/weapon-trait.entity';
import { WeaponAlternativeDamage } from './entities/weapon-alternative-damage.entity';
import { WeaponExtraDamage } from './entities/weapon-extra-damage.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { SizeGrade } from '../size-grades/entities/size-grade.entity';
import { DamageType } from '../damage-types/entities/damage-type.entity';
import { Trait } from '../traits/entities/trait.entity';

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
    @InjectRepository(WeaponTrait)
    private readonly weaponTraitsRepository: Repository<WeaponTrait>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(SizeGrade)
    private readonly sizeGradesRepository: Repository<SizeGrade>,
    @InjectRepository(DamageType)
    private readonly damageTypesRepository: Repository<DamageType>,
    @InjectRepository(Trait)
    private readonly traitsRepository: Repository<Trait>,
    @InjectRepository(WeaponAlternativeDamage)
    private readonly weaponAlternativeDamagesRepository: Repository<WeaponAlternativeDamage>,
    @InjectRepository(WeaponExtraDamage)
    private readonly weaponExtraDamagesRepository: Repository<WeaponExtraDamage>,
  ) {}

  findByName(name: string): Promise<Weapon | null> {
    return this.weaponsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Weapon | null> {
    const weapon = await this.weaponsRepository.findOne({
      where: { id },
      relations: {
        currency: true,
        sizeGrade: true,
        damageType: true,
        alternativeDamages: { damageType: true },
        extraDamages: { damageType: true },
      },
    });
    if (!weapon) {
      return null;
    }
    weapon.tags = await loadOrderedTagsForOwner(
      this.weaponTagsRepository,
      id,
      'weapon',
    );
    weapon.traits = await this.loadOrderedTraitsForWeapon(id);
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

  private async findTraitsByIds(traitIds: string[]): Promise<Trait[]> {
    const uniqueIds = [...new Set(traitIds)];
    const traits = await this.traitsRepository.findBy({ id: In(uniqueIds) });
    if (traits.length !== uniqueIds.length) {
      throw new NotFoundException('Um ou mais traços não foram encontrados.');
    }
    const traitsById = new Map(traits.map((trait) => [trait.id, trait]));
    return uniqueIds.map((id) => traitsById.get(id)!);
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

  private async findSizeGradeById(sizeGradeId: string): Promise<SizeGrade> {
    const sizeGrade = await this.sizeGradesRepository.findOneBy({
      id: sizeGradeId,
    });
    if (!sizeGrade) {
      throw new NotFoundException('Grau de tamanho não encontrado.');
    }
    return sizeGrade;
  }

  private async findDamageTypeById(damageTypeId: string): Promise<DamageType> {
    const damageType = await this.damageTypesRepository.findOneBy({
      id: damageTypeId,
    });
    if (!damageType) {
      throw new NotFoundException('Tipo de dano não encontrado.');
    }
    return damageType;
  }

  private async findDamageTypesByIds(
    damageTypeIds: string[],
  ): Promise<Map<string, DamageType>> {
    const uniqueIds = [...new Set(damageTypeIds)];
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const damageTypes = await this.damageTypesRepository.findBy({
      id: In(uniqueIds),
    });
    return new Map(
      damageTypes.map((damageType) => [damageType.id, damageType]),
    );
  }

  private async buildAlternativeDamageEntries(
    entries: WeaponDamageInputDto[],
  ): Promise<WeaponAlternativeDamage[]> {
    const damageTypeIds = entries
      .map((entry) => entry.damageTypeId)
      .filter((id): id is string => !!id);
    const damageTypesById = await this.findDamageTypesByIds(damageTypeIds);
    if (damageTypesById.size !== new Set(damageTypeIds).size) {
      throw new NotFoundException(
        'Um ou mais tipos de dano informados nos danos alternativos não foram encontrados.',
      );
    }

    return entries.map((entry, index) =>
      this.weaponAlternativeDamagesRepository.create({
        damageValue: entry.damageValue ?? null,
        damageDie: entry.damageDie ?? null,
        damageType: entry.damageTypeId
          ? (damageTypesById.get(entry.damageTypeId) ?? null)
          : null,
        magicalDamage: entry.magicalDamage ?? false,
        distanceMeters: entry.distanceMeters ?? null,
        usesAmmunition: entry.usesAmmunition ?? false,
        reloadActions: entry.reloadActions ?? null,
        order: index,
      }),
    );
  }

  private async buildExtraDamageEntries(
    entries: WeaponDamageInputDto[],
  ): Promise<WeaponExtraDamage[]> {
    const damageTypeIds = entries
      .map((entry) => entry.damageTypeId)
      .filter((id): id is string => !!id);
    const damageTypesById = await this.findDamageTypesByIds(damageTypeIds);
    if (damageTypesById.size !== new Set(damageTypeIds).size) {
      throw new NotFoundException(
        'Um ou mais tipos de dano informados nos danos extras não foram encontrados.',
      );
    }

    return entries.map((entry, index) =>
      this.weaponExtraDamagesRepository.create({
        damageValue: entry.damageValue ?? null,
        damageDie: entry.damageDie ?? null,
        damageType: entry.damageTypeId
          ? (damageTypesById.get(entry.damageTypeId) ?? null)
          : null,
        magicalDamage: entry.magicalDamage ?? false,
        distanceMeters: entry.distanceMeters ?? null,
        usesAmmunition: entry.usesAmmunition ?? false,
        reloadActions: entry.reloadActions ?? null,
        order: index,
      }),
    );
  }

  private async loadOrderedTraitsForWeapon(weaponId: string): Promise<Trait[]> {
    const traitsByWeaponId = await this.loadOrderedTraitsMap([weaponId]);
    return traitsByWeaponId.get(weaponId) ?? [];
  }

  private async loadOrderedTraitsMap(
    weaponIds: string[],
  ): Promise<Map<string, Trait[]>> {
    const traitsByWeaponId = new Map<string, Trait[]>();
    if (weaponIds.length === 0) {
      return traitsByWeaponId;
    }

    const rows = await this.weaponTraitsRepository.find({
      where: { weapon: { id: In(weaponIds) } },
      relations: { weapon: true, trait: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    for (const row of rows) {
      const traits = traitsByWeaponId.get(row.weapon.id) ?? [];
      traits.push(row.trait);
      traitsByWeaponId.set(row.weapon.id, traits);
    }

    return traitsByWeaponId;
  }

  private async createOrderedTraitJunctions(
    weapon: Weapon,
    traits: Trait[],
  ): Promise<void> {
    if (traits.length === 0) {
      return;
    }
    const junctions = traits.map((trait, index) =>
      this.weaponTraitsRepository.create({ weapon, trait, order: index }),
    );
    await this.weaponTraitsRepository.save(junctions);
  }

  private async replaceOrderedTraitJunctions(
    weapon: Weapon,
    traits: Trait[],
  ): Promise<void> {
    await this.weaponTraitsRepository.delete({ weapon: { id: weapon.id } });
    await this.createOrderedTraitJunctions(weapon, traits);
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

    const traits =
      dto.traitIds && dto.traitIds.length > 0
        ? await this.findTraitsByIds(dto.traitIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const sizeGrade = dto.sizeGradeId
      ? await this.findSizeGradeById(dto.sizeGradeId)
      : null;

    const damageType = dto.damageTypeId
      ? await this.findDamageTypeById(dto.damageTypeId)
      : null;

    const alternativeDamages =
      dto.alternativeDamages && dto.alternativeDamages.length > 0
        ? await this.buildAlternativeDamageEntries(dto.alternativeDamages)
        : [];

    const extraDamages =
      dto.extraDamages && dto.extraDamages.length > 0
        ? await this.buildExtraDamageEntries(dto.extraDamages)
        : [];

    const weapon = this.weaponsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
      nickname: dto.nickname ?? null,
      volume: dto.volume ?? null,
      sizeGrade,
      hands: dto.hands ?? null,
      weaponStyle: dto.weaponStyle ?? null,
      damageValue: dto.damageValue ?? null,
      damageDie: dto.damageDie ?? null,
      damageType,
      magicalDamage: dto.magicalDamage ?? false,
      distanceMeters: dto.distanceMeters ?? null,
      usesAmmunition: dto.usesAmmunition ?? false,
      reloadActions: dto.reloadActions ?? null,
      alternativeDamages,
      extraDamages,
      enchantments: (dto.enchantments ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      })),
      enhancements: (dto.enhancements ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      })),
    });

    const savedWeapon = await this.weaponsRepository.save(weapon);
    await createOrderedTagJunctions(
      this.weaponTagsRepository,
      'weapon',
      savedWeapon,
      tags,
    );
    await this.createOrderedTraitJunctions(savedWeapon, traits);
    savedWeapon.tags = tags;
    savedWeapon.traits = traits;
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

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'weapon_tags',
          'weapon_tag_filter',
          'weapon_tag_filter.weapon_id = weapon.id AND weapon_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('weapon.id')
        .having('COUNT(DISTINCT weapon_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por arma). Sem filtro de tags, `getCount()` é suficiente e evita
    // trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('weapon.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['weapon.id', 'weapon.name'])
      .orderBy('weapon.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const weapons = await this.weaponsRepository.find({
      where: { id: In(ids.map((weapon) => weapon.id)) },
      relations: { currency: true, sizeGrade: true, damageType: true },
      order: { name: 'ASC' },
    });

    const tagsByWeaponId = await loadOrderedTagsMap(
      this.weaponTagsRepository,
      weapons.map((weapon) => weapon.id),
      'weapon',
    );
    const traitsByWeaponId = await this.loadOrderedTraitsMap(
      weapons.map((weapon) => weapon.id),
    );
    for (const weapon of weapons) {
      weapon.tags = tagsByWeaponId.get(weapon.id) ?? [];
      weapon.traits = traitsByWeaponId.get(weapon.id) ?? [];
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
    if (dto.nickname !== undefined) {
      weapon.nickname = dto.nickname;
    }
    if (dto.volume !== undefined) {
      weapon.volume = dto.volume;
    }
    if (dto.sizeGradeId !== undefined) {
      weapon.sizeGrade = dto.sizeGradeId
        ? await this.findSizeGradeById(dto.sizeGradeId)
        : null;
    }
    if (dto.hands !== undefined) {
      weapon.hands = dto.hands;
    }
    if (dto.weaponStyle !== undefined) {
      weapon.weaponStyle = dto.weaponStyle;
    }
    if (dto.damageValue !== undefined) {
      weapon.damageValue = dto.damageValue;
    }
    if (dto.damageDie !== undefined) {
      weapon.damageDie = dto.damageDie;
    }
    if (dto.damageTypeId !== undefined) {
      weapon.damageType = dto.damageTypeId
        ? await this.findDamageTypeById(dto.damageTypeId)
        : null;
    }
    if (dto.magicalDamage !== undefined) {
      weapon.magicalDamage = dto.magicalDamage;
    }
    if (dto.distanceMeters !== undefined) {
      weapon.distanceMeters = dto.distanceMeters;
    }
    if (dto.usesAmmunition !== undefined) {
      weapon.usesAmmunition = dto.usesAmmunition;
    }
    if (dto.reloadActions !== undefined) {
      weapon.reloadActions = dto.reloadActions;
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

    let traits = weapon.traits;
    if (dto.traitIds !== undefined) {
      traits =
        dto.traitIds.length > 0 ? await this.findTraitsByIds(dto.traitIds) : [];
      await this.replaceOrderedTraitJunctions(weapon, traits);
    }

    if (dto.alternativeDamages !== undefined) {
      // Reatribuir `weapon.alternativeDamages` inteiro e deixar o cascade save cuidar
      // da remoção via `orphanedRowAction` falha com violação de not-null: o TypeORM
      // tenta primeiro um UPDATE setando "weapon_id" = NULL nas linhas órfãs antes de
      // excluí-las (mesmo problema e mesma solução usada em LocationsService para
      // `sections`). Por isso os itens antigos são removidos explicitamente pelo
      // repositório antes de atribuir os novos.
      if (weapon.alternativeDamages.length > 0) {
        await this.weaponAlternativeDamagesRepository.remove(
          weapon.alternativeDamages,
        );
      }
      weapon.alternativeDamages =
        dto.alternativeDamages.length > 0
          ? await this.buildAlternativeDamageEntries(dto.alternativeDamages)
          : [];
    }

    if (dto.extraDamages !== undefined) {
      if (weapon.extraDamages.length > 0) {
        await this.weaponExtraDamagesRepository.remove(weapon.extraDamages);
      }
      weapon.extraDamages =
        dto.extraDamages.length > 0
          ? await this.buildExtraDamageEntries(dto.extraDamages)
          : [];
    }

    if (dto.enchantments !== undefined) {
      weapon.enchantments = dto.enchantments.map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      }));
    }
    if (dto.enhancements !== undefined) {
      weapon.enhancements = dto.enhancements.map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      }));
    }

    const savedWeapon = await this.weaponsRepository.save(weapon);
    savedWeapon.tags = tags;
    savedWeapon.traits = traits;
    return savedWeapon;
  }

  async remove(id: string): Promise<void> {
    const result = await this.weaponsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Arma não encontrada.');
    }
  }
}
