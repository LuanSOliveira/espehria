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
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FindLocationsQueryDto } from './dto/find-locations-query.dto';
import { LocationSectionInputDto } from './dto/location-section-input.dto';
import { Location } from './entities/location.entity';
import { LocationSection } from './entities/location-section.entity';
import { LocationTag } from './entities/location-tag.entity';
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
    @InjectRepository(LocationTag)
    private readonly locationTagsRepository: Repository<LocationTag>,
  ) {}

  findByName(name: string): Promise<Location | null> {
    return this.locationsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Location | null> {
    const location = await this.locationsRepository.findOne({
      where: { id },
      relations: {
        pointsOfInterest: true,
        pointsOfInterestOf: true,
        sections: true,
      },
    });
    if (!location) {
      return null;
    }
    location.tags = await loadOrderedTagsForOwner(
      this.locationTagsRepository,
      id,
      'location',
    );
    return location;
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
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    return uniqueIds.map((id) => tagsById.get(id)!);
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
      privateInformation: dto.privateInformation ?? null,
      pointsOfInterest,
      sections,
    });

    const savedLocation = await this.locationsRepository.save(location);
    await createOrderedTagJunctions(
      this.locationTagsRepository,
      'location',
      savedLocation,
      tags,
    );
    savedLocation.tags = tags;
    return savedLocation;
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

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'location_tags',
          'location_tag_filter',
          'location_tag_filter.location_id = location.id AND location_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('location.id')
        .having('COUNT(DISTINCT location_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por local). Sem filtro de tags, `getCount()` é suficiente e evita
    // trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('location.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['location.id', 'location.name'])
      .orderBy('location.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const locations = await this.locationsRepository.find({
      where: { id: In(ids.map((location) => location.id)) },
    });

    const tagsByLocationId = await loadOrderedTagsMap(
      this.locationTagsRepository,
      locations.map((location) => location.id),
      'location',
    );
    for (const location of locations) {
      location.tags = tagsByLocationId.get(location.id) ?? [];
    }

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
    if (dto.privateInformation !== undefined) {
      location.privateInformation = dto.privateInformation;
    }
    let tags = location.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.locationTagsRepository,
        'location',
        location,
        tags,
      );
    }
    if (dto.pointsOfInterestIds !== undefined) {
      location.pointsOfInterest =
        dto.pointsOfInterestIds.length > 0
          ? await this.findLocationsByIds(dto.pointsOfInterestIds)
          : [];
    }
    if (dto.sections !== undefined) {
      // Reatribuir `location.sections` inteiro e deixar o cascade save cuidar da
      // remoção via orphanedRowAction falha com violação de not-null: o TypeORM
      // tenta primeiro um UPDATE setando "location_id" = NULL nas linhas órfãs
      // antes de excluí-las, o que quebra a coluna NOT NULL (mesmo problema e
      // mesma solução usada em CharactersService/OrganizationsService/
      // FamiliesService). Por isso as seções antigas são removidas explicitamente
      // pelo repositório antes de atribuir as novas.
      if (location.sections.length > 0) {
        await this.locationSectionsRepository.remove(location.sections);
      }
      location.sections =
        dto.sections.length > 0 ? this.buildSections(dto.sections) : [];
    }

    const savedLocation = await this.locationsRepository.save(location);
    savedLocation.tags = tags;
    return savedLocation;
  }

  async remove(id: string): Promise<void> {
    const result = await this.locationsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Local não encontrado.');
    }
  }
}
