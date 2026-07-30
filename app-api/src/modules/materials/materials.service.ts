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
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { FindMaterialsQueryDto } from './dto/find-materials-query.dto';
import { Material } from './entities/material.entity';
import { Tag } from '../tags/entities/tag.entity';

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
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findByName(name: string): Promise<Material | null> {
    return this.materialsRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Material | null> {
    return this.materialsRepository.findOne({
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

  async create(dto: CreateMaterialDto): Promise<Material> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um material com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const material = this.materialsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      price: dto.price ?? null,
      privateInformation: dto.privateInformation ?? null,
      tags,
    });

    return this.materialsRepository.save(material);
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
      relations: { tags: true },
      order: { name: 'ASC' },
    });

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
    if (dto.privateInformation !== undefined) {
      material.privateInformation = dto.privateInformation;
    }
    if (dto.tagIds !== undefined) {
      material.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    return this.materialsRepository.save(material);
  }

  async remove(id: string): Promise<void> {
    const result = await this.materialsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Material não encontrado.');
    }
  }
}
