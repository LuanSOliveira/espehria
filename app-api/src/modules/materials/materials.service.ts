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
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { FindMaterialsQueryDto } from './dto/find-materials-query.dto';
import { Material } from './entities/material.entity';
import { MaterialTag } from './entities/material-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Currency } from '../currencies/entities/currency.entity';

export interface PaginatedMaterials {
  data: Material[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialsRepository: Repository<Material>,
    @InjectRepository(MaterialTag)
    private readonly materialTagsRepository: Repository<MaterialTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  findByName(name: string): Promise<Material | null> {
    return this.materialsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Material | null> {
    const material = await this.materialsRepository.findOne({
      where: { id },
      relations: { currency: true },
    });
    if (!material) {
      return null;
    }
    material.tags = await loadOrderedTagsForOwner(
      this.materialTagsRepository,
      id,
      'material',
    );
    return material;
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

  async create(dto: CreateMaterialDto): Promise<Material> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um material com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const currency = dto.currencyId
      ? await this.findCurrencyById(dto.currencyId)
      : null;

    const material = this.materialsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      currency,
      privateInformation: dto.privateInformation ?? null,
    });

    const savedMaterial = await this.materialsRepository.save(material);
    await createOrderedTagJunctions(
      this.materialTagsRepository,
      'material',
      savedMaterial,
      tags,
    );
    savedMaterial.tags = tags;
    return savedMaterial;
  }

  async findAllPaginated(
    query: FindMaterialsQueryDto,
  ): Promise<PaginatedMaterials> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.materialsRepository.createQueryBuilder('material');

    if (query.name) {
      queryBuilder.andWhere('material.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['material.id', 'material.name'])
      .orderBy('material.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const materials = await this.materialsRepository.find({
      where: { id: In(ids.map((material) => material.id)) },
      relations: { currency: true },
      order: { name: 'ASC' },
    });

    const tagsByMaterialId = await loadOrderedTagsMap(
      this.materialTagsRepository,
      materials.map((material) => material.id),
      'material',
    );
    for (const material of materials) {
      material.tags = tagsByMaterialId.get(material.id) ?? [];
    }

    const materialsById = new Map(
      materials.map((material) => [material.id, material]),
    );
    const data = ids
      .map((material) => materialsById.get(material.id))
      .filter((material): material is Material => material !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findById(id);
    if (!material) {
      throw new NotFoundException('Material não encontrado.');
    }

    if (dto.name && dto.name !== material.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um material com este nome.');
      }
      material.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      material.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      material.description = dto.description;
    }
    if (dto.price !== undefined) {
      material.price = dto.price;
    }
    if (dto.price === null) {
      material.currency = null;
    } else if (dto.currencyId !== undefined) {
      material.currency = await this.findCurrencyById(dto.currencyId);
    }
    if (dto.privateInformation !== undefined) {
      material.privateInformation = dto.privateInformation;
    }
    let tags = material.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.materialTagsRepository,
        'material',
        material,
        tags,
      );
    }

    const savedMaterial = await this.materialsRepository.save(material);
    savedMaterial.tags = tags;
    return savedMaterial;
  }

  async remove(id: string): Promise<void> {
    const result = await this.materialsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Material não encontrado.');
    }
  }
}
