import {
  BadRequestException,
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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { OrganizationMemberInputDto } from './dto/organization-member-input.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Character } from '../characters/entities/character.entity';

export interface PaginatedOrganizations {
  data: Organization[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly organizationMembersRepository: Repository<OrganizationMember>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Character)
    private readonly charactersRepository: Repository<Character>,
  ) {}

  findByName(name: string): Promise<Organization | null> {
    return this.organizationsRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Organization | null> {
    return this.organizationsRepository.findOne({
      where: { id },
      relations: { tags: true, members: { character: true } },
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

  private async findCharactersByIds(ids: string[]): Promise<Character[]> {
    const uniqueIds = [...new Set(ids)];
    const characters = await this.charactersRepository.findBy({
      id: In(uniqueIds),
    });
    if (characters.length !== uniqueIds.length) {
      throw new NotFoundException(
        'Um ou mais personagens membros não foram encontrados.',
      );
    }
    return characters;
  }

  private assertNoDuplicateMembers(
    members: OrganizationMemberInputDto[],
  ): void {
    const characterIds = members.map((member) => member.characterId);
    if (new Set(characterIds).size !== characterIds.length) {
      throw new BadRequestException(
        'Não é permitido cadastrar o mesmo personagem mais de uma vez na lista de membros.',
      );
    }
  }

  private async buildMembers(
    members: OrganizationMemberInputDto[],
  ): Promise<OrganizationMember[]> {
    this.assertNoDuplicateMembers(members);

    const characterIds = members.map((member) => member.characterId);
    const characters =
      characterIds.length > 0
        ? await this.findCharactersByIds(characterIds)
        : [];
    const charactersById = new Map(
      characters.map((character) => [character.id, character]),
    );

    return members.map((input) => {
      const character = charactersById.get(input.characterId);
      if (!character) {
        throw new NotFoundException(
          'Um ou mais personagens membros não foram encontrados.',
        );
      }
      return this.organizationMembersRepository.create({
        role: input.role,
        character,
      });
    });
  }

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma organização com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const members =
      dto.members && dto.members.length > 0
        ? await this.buildMembers(dto.members)
        : [];

    const organization = this.organizationsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      tags,
      members,
    });

    return this.organizationsRepository.save(organization);
  }

  async findAllPaginated(
    query: FindOrganizationsQueryDto,
  ): Promise<PaginatedOrganizations> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.organizationsRepository.createQueryBuilder('organization');

    if (query.name) {
      queryBuilder.andWhere('organization.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['organization.id', 'organization.name'])
      .orderBy('organization.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const organizations = await this.organizationsRepository.find({
      where: { id: In(ids.map((organization) => organization.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const organizationsById = new Map(
      organizations.map((organization) => [organization.id, organization]),
    );
    const data = ids
      .map((organization) => organizationsById.get(organization.id))
      .filter(
        (organization): organization is Organization =>
          organization !== undefined,
      );

    return { data, total, page, perPage };
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }

    if (dto.name && dto.name !== organization.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException(
          'Já existe uma organização com este nome.',
        );
      }
      organization.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      organization.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      organization.description = dto.description;
    }
    if (dto.tagIds !== undefined) {
      organization.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }
    if (dto.members !== undefined) {
      organization.members =
        dto.members.length > 0 ? await this.buildMembers(dto.members) : [];
    }

    return this.organizationsRepository.save(organization);
  }

  async remove(id: string): Promise<void> {
    const result = await this.organizationsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Organização não encontrada.');
    }
  }
}
