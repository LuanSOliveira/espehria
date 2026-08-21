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
import { ArmorTrait } from './entities/armor-trait.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { ArmorCategory } from '../armor-categories/entities/armor-category.entity';
import { Trait } from '../traits/entities/trait.entity';

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
    @InjectRepository(ArmorTrait)
    private readonly armorTraitsRepository: Repository<ArmorTrait>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(ArmorCategory)
    private readonly armorCategoriesRepository: Repository<ArmorCategory>,
    @InjectRepository(Trait)
    private readonly traitsRepository: Repository<Trait>,
  ) {}

  findByName(name: string): Promise<Armor | null> {
    return this.armorsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Armor | null> {
    const armor = await this.armorsRepository.findOne({
      where: { id },
      relations: { currency: true, armorCategory: true },
    });
    if (!armor) {
      return null;
    }
    armor.tags = await loadOrderedTagsForOwner(
      this.armorTagsRepository,
      id,
      'armor',
    );
    armor.traits = await this.loadOrderedTraitsForArmor(id);
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

  private async findArmorCategoryById(
    armorCategoryId: string,
  ): Promise<ArmorCategory> {
    const armorCategory = await this.armorCategoriesRepository.findOneBy({
      id: armorCategoryId,
    });
    if (!armorCategory) {
      throw new NotFoundException('Categoria de armadura não encontrada.');
    }
    return armorCategory;
  }

  private async loadOrderedTraitsForArmor(armorId: string): Promise<Trait[]> {
    const traitsByArmorId = await this.loadOrderedTraitsMap([armorId]);
    return traitsByArmorId.get(armorId) ?? [];
  }

  private async loadOrderedTraitsMap(
    armorIds: string[],
  ): Promise<Map<string, Trait[]>> {
    const traitsByArmorId = new Map<string, Trait[]>();
    if (armorIds.length === 0) {
      return traitsByArmorId;
    }

    const rows = await this.armorTraitsRepository.find({
      where: { armor: { id: In(armorIds) } },
      relations: { armor: true, trait: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    for (const row of rows) {
      const traits = traitsByArmorId.get(row.armor.id) ?? [];
      traits.push(row.trait);
      traitsByArmorId.set(row.armor.id, traits);
    }

    return traitsByArmorId;
  }

  private async createOrderedTraitJunctions(
    armor: Armor,
    traits: Trait[],
  ): Promise<void> {
    if (traits.length === 0) {
      return;
    }
    const junctions = traits.map((trait, index) =>
      this.armorTraitsRepository.create({ armor, trait, order: index }),
    );
    await this.armorTraitsRepository.save(junctions);
  }

  private async replaceOrderedTraitJunctions(
    armor: Armor,
    traits: Trait[],
  ): Promise<void> {
    await this.armorTraitsRepository.delete({ armor: { id: armor.id } });
    await this.createOrderedTraitJunctions(armor, traits);
  }

  /**
   * Monta uma instância de `Armor` com as relações resolvidas (moeda, tags, traços,
   * categoria da armadura), sem persistir nada — usada para gerar o snapshot de um
   * item avulso de inventário de ficha (`SheetsService`), reaproveitando a mesma
   * resolução de referências usada em `create()`.
   */
  async buildSnapshotFromDto(dto: CreateArmorDto): Promise<Armor> {
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

    const armorCategory = dto.armorCategoryId
      ? await this.findArmorCategoryById(dto.armorCategoryId)
      : null;

    const armor = this.armorsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
      nickname: dto.nickname ?? null,
      volume: dto.volume ?? null,
      armorCategory,
      armorClassBonus: dto.armorClassBonus ?? null,
      dexterityModifierLimit: dto.dexterityModifierLimit ?? null,
      strength: dto.strength ?? null,
      checkPenalty: dto.checkPenalty ?? null,
      speedPenaltyMeters: dto.speedPenaltyMeters ?? null,
      enchantments: (dto.enchantments ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      })),
      enhancements: (dto.enhancements ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      })),
    });
    armor.tags = tags;
    armor.traits = traits;
    return armor;
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

    const traits =
      dto.traitIds && dto.traitIds.length > 0
        ? await this.findTraitsByIds(dto.traitIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const armorCategory = dto.armorCategoryId
      ? await this.findArmorCategoryById(dto.armorCategoryId)
      : null;

    const armor = this.armorsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
      nickname: dto.nickname ?? null,
      volume: dto.volume ?? null,
      armorCategory,
      armorClassBonus: dto.armorClassBonus ?? null,
      dexterityModifierLimit: dto.dexterityModifierLimit ?? null,
      strength: dto.strength ?? null,
      checkPenalty: dto.checkPenalty ?? null,
      speedPenaltyMeters: dto.speedPenaltyMeters ?? null,
      enchantments: (dto.enchantments ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      })),
      enhancements: (dto.enhancements ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      })),
    });

    const savedArmor = await this.armorsRepository.save(armor);
    await createOrderedTagJunctions(
      this.armorTagsRepository,
      'armor',
      savedArmor,
      tags,
    );
    await this.createOrderedTraitJunctions(savedArmor, traits);
    savedArmor.tags = tags;
    savedArmor.traits = traits;
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

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'armor_tags',
          'armor_tag_filter',
          'armor_tag_filter.armor_id = armor.id AND armor_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('armor.id')
        .having('COUNT(DISTINCT armor_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por armadura). Sem filtro de tags, `getCount()` é suficiente e
    // evita trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('armor.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['armor.id', 'armor.name'])
      .orderBy('armor.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const armors = await this.armorsRepository.find({
      where: { id: In(ids.map((armor) => armor.id)) },
      relations: { currency: true, armorCategory: true },
      order: { name: 'ASC' },
    });

    const tagsByArmorId = await loadOrderedTagsMap(
      this.armorTagsRepository,
      armors.map((armor) => armor.id),
      'armor',
    );
    const traitsByArmorId = await this.loadOrderedTraitsMap(
      armors.map((armor) => armor.id),
    );
    for (const armor of armors) {
      armor.tags = tagsByArmorId.get(armor.id) ?? [];
      armor.traits = traitsByArmorId.get(armor.id) ?? [];
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
    if (dto.nickname !== undefined) {
      armor.nickname = dto.nickname;
    }
    if (dto.volume !== undefined) {
      armor.volume = dto.volume;
    }
    if (dto.armorCategoryId !== undefined) {
      armor.armorCategory = dto.armorCategoryId
        ? await this.findArmorCategoryById(dto.armorCategoryId)
        : null;
    }
    if (dto.armorClassBonus !== undefined) {
      armor.armorClassBonus = dto.armorClassBonus;
    }
    if (dto.dexterityModifierLimit !== undefined) {
      armor.dexterityModifierLimit = dto.dexterityModifierLimit;
    }
    if (dto.strength !== undefined) {
      armor.strength = dto.strength;
    }
    if (dto.checkPenalty !== undefined) {
      armor.checkPenalty = dto.checkPenalty;
    }
    if (dto.speedPenaltyMeters !== undefined) {
      armor.speedPenaltyMeters = dto.speedPenaltyMeters;
    }
    if (dto.enchantments !== undefined) {
      armor.enchantments = dto.enchantments.map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      }));
    }
    if (dto.enhancements !== undefined) {
      armor.enhancements = dto.enhancements.map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      }));
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

    let traits = armor.traits;
    if (dto.traitIds !== undefined) {
      traits =
        dto.traitIds.length > 0 ? await this.findTraitsByIds(dto.traitIds) : [];
      await this.replaceOrderedTraitJunctions(armor, traits);
    }

    const savedArmor = await this.armorsRepository.save(armor);
    savedArmor.tags = tags;
    savedArmor.traits = traits;
    return savedArmor;
  }

  async remove(id: string): Promise<void> {
    const result = await this.armorsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Armadura não encontrada.');
    }
  }
}
