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
import {
  createOrderedTagJunctions,
  loadOrderedTagsForOwner,
  loadOrderedTagsMap,
  replaceOrderedTagJunctions,
} from '../../common/utils/ordered-tags.util';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { OrganizationMemberInputDto } from './dto/organization-member-input.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationTag } from './entities/organization-tag.entity';
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
    @InjectRepository(OrganizationTag)
    private readonly organizationTagsRepository: Repository<OrganizationTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Character)
    private readonly charactersRepository: Repository<Character>,
  ) {}

  findByName(name: string): Promise<Organization | null> {
    return this.organizationsRepository.findOneBy({ name });
  }

  async findById(id: string): Promise<Organization | null> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: { members: { character: true } },
    });
    if (!organization) {
      return null;
    }
    organization.tags = await loadOrderedTagsForOwner(
      this.organizationTagsRepository,
      id,
      'organization',
    );
    return organization;
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

  // Reassigning `organization.members` inteiro e deixando o cascade save cuidar
  // da remoção via orphanedRowAction falha com violação de not-null: o TypeORM
  // tenta primeiro um UPDATE setando "character_id" = NULL nas linhas órfãs
  // antes de excluí-las, o que quebra a coluna NOT NULL. Por isso os membros
  // removidos, atualizados e adicionados são sincronizados diretamente pelo
  // repositório (mesmo problema e mesma solução usada em CharactersService).
  private async syncMembers(
    organization: Organization,
    members: OrganizationMemberInputDto[],
  ): Promise<void> {
    this.assertNoDuplicateMembers(members);

    const characterIds = members.map((member) => member.characterId);
    const characters =
      characterIds.length > 0
        ? await this.findCharactersByIds(characterIds)
        : [];
    const charactersById = new Map(
      characters.map((character) => [character.id, character]),
    );

    const existingByCharacterId = new Map(
      organization.members.map((member) => [member.character.id, member]),
    );

    const keptIds = new Set<string>();
    const toSave: OrganizationMember[] = [];

    for (const input of members) {
      const character = charactersById.get(input.characterId);
      if (!character) {
        throw new NotFoundException(
          'Um ou mais personagens membros não foram encontrados.',
        );
      }

      const existing = existingByCharacterId.get(input.characterId);
      if (existing) {
        keptIds.add(existing.id);
        if (existing.role !== input.role) {
          existing.role = input.role;
          toSave.push(existing);
        }
        continue;
      }

      toSave.push(
        this.organizationMembersRepository.create({
          role: input.role,
          organization,
          character,
        }),
      );
    }

    const toRemove = organization.members.filter(
      (member) => !keptIds.has(member.id),
    );

    if (toRemove.length > 0) {
      await this.organizationMembersRepository.remove(toRemove);
    }
    if (toSave.length > 0) {
      await this.organizationMembersRepository.save(toSave);
    }
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
      privateInformation: dto.privateInformation ?? null,
      members,
    });

    const savedOrganization =
      await this.organizationsRepository.save(organization);
    await createOrderedTagJunctions(
      this.organizationTagsRepository,
      'organization',
      savedOrganization,
      tags,
    );
    savedOrganization.tags = tags;
    return savedOrganization;
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

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'organization_tags',
          'organization_tag_filter',
          'organization_tag_filter.organization_id = organization.id AND organization_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('organization.id')
        .having('COUNT(DISTINCT organization_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por organização). Sem filtro de tags, `getCount()` é suficiente e
    // evita trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('organization.id').getRawMany())
          .length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['organization.id', 'organization.name'])
      .orderBy('organization.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const organizations = await this.organizationsRepository.find({
      where: { id: In(ids.map((organization) => organization.id)) },
      order: { name: 'ASC' },
    });

    const tagsByOrganizationId = await loadOrderedTagsMap(
      this.organizationTagsRepository,
      organizations.map((organization) => organization.id),
      'organization',
    );
    for (const organization of organizations) {
      organization.tags = tagsByOrganizationId.get(organization.id) ?? [];
    }

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

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }

    if (dto.name && dto.name !== organization.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma organização com este nome.');
      }
      organization.name = dto.name;
    }

    if (dto.referenceImage !== undefined) {
      organization.referenceImage = dto.referenceImage;
    }
    if (dto.description !== undefined) {
      organization.description = dto.description;
    }
    if (dto.privateInformation !== undefined) {
      organization.privateInformation = dto.privateInformation;
    }
    if (dto.tagIds !== undefined) {
      const tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.organizationTagsRepository,
        'organization',
        organization,
        tags,
      );
    }

    await this.organizationsRepository.save(organization);

    if (dto.members !== undefined) {
      await this.syncMembers(organization, dto.members);
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException('Organização não encontrada.');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.organizationsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Organização não encontrada.');
    }
  }
}
