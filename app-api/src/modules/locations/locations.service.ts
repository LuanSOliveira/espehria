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
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FindLocationsQueryDto } from './dto/find-locations-query.dto';
import { LocationSectionInputDto } from './dto/location-section-input.dto';
import { Location } from './entities/location.entity';
import { LocationSection } from './entities/location-section.entity';
import { Tag } from '../tags/entities/tag.entity';

export interface PaginatedLocations {
  data: Location[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationsRepository: Repository<Location>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(LocationSection)
    private readonly locationSectionsRepository: Repository<LocationSection>,
  ) {}

  findByName(name: string): Promise<Location | null> {
    return this.locationsRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Location | null> {
    return this.locationsRepository.findOne({
      where: { id },
      relations: {
        tags: true,
        pointsOfInterest: true,
        pointsOfInterestOf: true,
        sections: true,
      },
    });
  }

  private buildSections(
    sections: LocationSectionInputDto[],
  ): LocationSection[] {
    return sections.map((section, index) =>
      this.locationSectionsRepository.create({
        label: section.label,
        description: section.description ?? null,
        order: index,
      }),
    );
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  private async findLocationsByIds(ids: string[]): Promise<Location[]> {
    const uniqueIds = [...new Set(ids)];
    const locations = await this.locationsRepository.findBy({
      id: In(uniqueIds),
    });
    if (locations.length !== uniqueIds.length) {
      throw new NotFoundException(
        'Um ou mais locais (pontos de interesse) não foram encontrados.',
      );
    }
    return locations;
  }

  async create(dto: CreateLocationDto): Promise<Location> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe um local com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const pointsOfInterest =
      dto.pointsOfInterestIds && dto.pointsOfInterestIds.length > 0
        ? await this.findLocationsByIds(dto.pointsOfInterestIds)
        : [];

    const sections =
      dto.sections && dto.sections.length > 0
        ? this.buildSections(dto.sections)
        : [];

    const location = this.locationsRepository.create({
      name: dto.name,
      type: dto.type ?? null,
      referenceImageUrl: dto.referenceImageUrl ?? null,
      description: dto.description ?? null,
      tags,
      pointsOfInterest,
      sections,
    });

    return this.locationsRepository.save(location);
  }

  async findAllPaginated(
    query: FindLocationsQueryDto,
  ): Promise<PaginatedLocations> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.locationsRepository.createQueryBuilder('location');

    if (query.name) {
      queryBuilder.andWhere('location.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('location.type ILIKE :type', {
        type: `%${query.type}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['location.id', 'location.name'])
      .orderBy('location.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const locations = await this.locationsRepository.find({
      where: { id: In(ids.map((location) => location.id)) },
      relations: { tags: true },
    });

    const locationsById = new Map(
      locations.map((location) => [location.id, location]),
    );
    const data = ids
      .map((location) => locationsById.get(location.id))
      .filter((location): location is Location => location !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findById(id);
    if (!location) {
      throw new NotFoundException('Local não encontrado.');
    }

    if (dto.name && dto.name !== location.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe um local com este nome.');
      }
      location.name = dto.name;
    }

    if (dto.type !== undefined) {
      location.type = dto.type;
    }
    if (dto.referenceImageUrl !== undefined) {
      location.referenceImageUrl = dto.referenceImageUrl;
    }
    if (dto.description !== undefined) {
      location.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      location.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }
    if (dto.pointsOfInterestIds !== undefined) {
      location.pointsOfInterest =
        dto.pointsOfInterestIds.length > 0
          ? await this.findLocationsByIds(dto.pointsOfInterestIds)
          : [];
    }
    if (dto.sections !== undefined) {
      location.sections =
        dto.sections.length > 0 ? this.buildSections(dto.sections) : [];
    }

    return this.locationsRepository.save(location);
  }

  async remove(id: string): Promise<void> {
    const result = await this.locationsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Local não encontrado.');
    }
  }
}
