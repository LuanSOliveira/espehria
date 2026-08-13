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
import { CreateTraitDto } from './dto/create-trait.dto';
import { UpdateTraitDto } from './dto/update-trait.dto';
import { FindTraitsQueryDto } from './dto/find-traits-query.dto';
import { Trait } from './entities/trait.entity';
import { TraitTag } from './entities/trait-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TraitType } from '../trait-types/entities/trait-type.entity';

export interface PaginatedTraits {
  data: Trait[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class TraitsService {
  constructor(
    @InjectRepository(Trait)
    private readonly traitsRepository: Repository<Trait>,
    @InjectRepository(TraitTag)
    private readonly traitTagsRepository: Repository<TraitTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(TraitType)
    private readonly traitTypesRepository: Repository<TraitType>,
  ) {}

  findByName(name: string): Promise<Trait | null> {
    return this.traitsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Trait | null> {
    const trait = await this.traitsRepository.findOne({
      where: { id },
      relations: { traitType: true },
    });
    if (!trait) {
      return null;
    }
    trait.tags = await loadOrderedTagsForOwner(
      this.traitTagsRepository,
      id,
      'trait',
    );
    return trait;
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

  private async findTraitTypeById(traitTypeId: string): Promise<TraitType> {
    const traitType = await this.traitTypesRepository.findOneBy({
      id: traitTypeId,
    });
    if (!traitType) {
      throw new NotFoundException('Tipo de traço não encontrado.');
    }
    return traitType;
  }

  async create(dto: CreateTraitDto): Promise<Trait> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um traço com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const traitType = dto.traitTypeId
      ? await this.findTraitTypeById(dto.traitTypeId)
      : null;

    const trait = this.traitsRepository.create({
      name: dto.name,
      traitType,
      description: dto.description ?? null,
    });

    const savedTrait = await this.traitsRepository.save(trait);
    await createOrderedTagJunctions(
      this.traitTagsRepository,
      'trait',
      savedTrait,
      tags,
    );
    savedTrait.tags = tags;
    return savedTrait;
  }

  async findAllPaginated(query: FindTraitsQueryDto): Promise<PaginatedTraits> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.traitsRepository.createQueryBuilder('trait');

    if (query.name) {
      queryBuilder.andWhere('trait.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.traitTypeId) {
      queryBuilder.andWhere('trait.trait_type_id = :traitTypeId', {
        traitTypeId: query.traitTypeId,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['trait.id', 'trait.name'])
      .orderBy('trait.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const traits = await this.traitsRepository.find({
      where: { id: In(ids.map((trait) => trait.id)) },
      relations: { traitType: true },
      order: { name: 'ASC' },
    });

    const tagsByTraitId = await loadOrderedTagsMap(
      this.traitTagsRepository,
      traits.map((trait) => trait.id),
      'trait',
    );
    for (const trait of traits) {
      trait.tags = tagsByTraitId.get(trait.id) ?? [];
    }

    const traitsById = new Map(traits.map((trait) => [trait.id, trait]));
    const data = ids
      .map((trait) => traitsById.get(trait.id))
      .filter((trait): trait is Trait => trait !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateTraitDto): Promise<Trait> {
    const trait = await this.findById(id);
    if (!trait) {
      throw new NotFoundException('Traço não encontrado.');
    }

    if (dto.name && dto.name !== trait.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um traço com este nome.');
      }
      trait.name = dto.name;
    }

    if (dto.traitTypeId !== undefined) {
      trait.traitType = dto.traitTypeId
        ? await this.findTraitTypeById(dto.traitTypeId)
        : null;
    }
    if (dto.description !== undefined) {
      trait.description = dto.description;
    }

    let tags = trait.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.traitTagsRepository,
        'trait',
        trait,
        tags,
      );
    }

    const savedTrait = await this.traitsRepository.save(trait);
    savedTrait.tags = tags;
    return savedTrait;
  }

  async remove(id: string): Promise<void> {
    const result = await this.traitsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Traço não encontrado.');
    }
  }
}
