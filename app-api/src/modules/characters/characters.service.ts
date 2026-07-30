import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { FindCharactersQueryDto } from './dto/find-characters-query.dto';
import { Character } from './entities/character.entity';
import { Race } from '../races/entities/race.entity';
import { Tag } from '../tags/entities/tag.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Family } from '../families/entities/family.entity';
import { FamilyMember } from '../families/entities/family-member.entity';
import { FamilyRelationship } from '../families/entities/family-relationship.entity';

export interface PaginatedCharacters {
  data: Character[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character)
    private readonly charactersRepository: Repository<Character>,
    @InjectRepository(Race)
    private readonly racesRepository: Repository<Race>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(OrganizationMember)
    private readonly organizationMembersRepository: Repository<OrganizationMember>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly familyMembersRepository: Repository<FamilyMember>,
    @InjectRepository(FamilyRelationship)
    private readonly familyRelationshipsRepository: Repository<FamilyRelationship>,
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string): Promise<Character | null> {
    return this.charactersRepository.findOne({
      where: { id },
      relations: {
        race: { category: true, tags: true },
        tags: true,
        family: true,
        secondaryFamily: true,
      },
    });
  }

  async findOrganizationsForCharacter(
    characterId: string,
  ): Promise<Organization[]> {
    const memberships = await this.organizationMembersRepository.find({
      where: { character: { id: characterId } },
      relations: { organization: true },
    });
    return memberships.map((membership) => membership.organization);
  }

  private async findRaceById(
    id: string,
    repository: Repository<Race> = this.racesRepository,
  ): Promise<Race> {
    const race = await repository.findOne({
      where: { id },
      relations: { category: true, tags: true },
    });
    if (!race) {
      throw new NotFoundException('Raça não encontrada.');
    }
    return race;
  }

  private async findFamilyById(
    id: string,
    repository: Repository<Family> = this.familiesRepository,
  ): Promise<Family> {
    const family = await repository.findOneBy({ id });
    if (!family) {
      throw new NotFoundException('Família não encontrada.');
    }
    return family;
  }

  private async findTagsByIds(
    tagIds: string[],
    repository: Repository<Tag> = this.tagsRepository,
  ): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await repository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  private assertFamiliesAreDifferent(
    familyId: string | null,
    secondaryFamilyId: string | null,
  ): void {
    if (familyId && secondaryFamilyId && familyId === secondaryFamilyId) {
      throw new BadRequestException(
        'A família secundária não pode ser a mesma da família primária.',
      );
    }
  }

  // Fluxo inverso da árvore genealógica: quando a família (primária ou secundária) do
  // personagem é alterada diretamente pela edição do personagem, remove o card
  // (FamilyMember) e os vínculos (FamilyRelationship) desse personagem na família
  // anterior, já que ele deixou de pertencer a ela.
  private async detachCharacterFromFamily(
    characterId: string,
    familyId: string,
    familyMembersRepository: Repository<FamilyMember> = this
      .familyMembersRepository,
    familyRelationshipsRepository: Repository<FamilyRelationship> = this
      .familyRelationshipsRepository,
  ): Promise<void> {
    await familyMembersRepository.delete({
      character: { id: characterId },
      family: { id: familyId },
    });
    await familyRelationshipsRepository.delete({
      family: { id: familyId },
      sourceCharacter: { id: characterId },
    });
    await familyRelationshipsRepository.delete({
      family: { id: familyId },
      targetCharacter: { id: characterId },
    });
  }

  async create(dto: CreateCharacterDto): Promise<Character> {
    const race = dto.raceId ? await this.findRaceById(dto.raceId) : null;

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    this.assertFamiliesAreDifferent(
      dto.familyId ?? null,
      dto.secondaryFamilyId ?? null,
    );

    const family = dto.familyId
      ? await this.findFamilyById(dto.familyId)
      : null;
    const secondaryFamily = dto.secondaryFamilyId
      ? await this.findFamilyById(dto.secondaryFamilyId)
      : null;

    const character = this.charactersRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      privateInformation: dto.privateInformation ?? null,
      isDead: dto.isDead ?? false,
      race,
      tags,
      family,
      secondaryFamily,
    });

    return this.charactersRepository.save(character);
  }

  async findAllPaginated(
    query: FindCharactersQueryDto,
  ): Promise<PaginatedCharacters> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder =
      this.charactersRepository.createQueryBuilder('character');

    if (query.name) {
      queryBuilder.andWhere('character.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['character.id', 'character.name'])
      .orderBy('character.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const characters = await this.charactersRepository.find({
      where: { id: In(ids.map((character) => character.id)) },
      relations: { race: { category: true, tags: true }, tags: true },
      order: { name: 'ASC' },
    });

    const charactersById = new Map(
      characters.map((character) => [character.id, character]),
    );
    const data = ids
      .map((character) => charactersById.get(character.id))
      .filter((character): character is Character => character !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateCharacterDto): Promise<Character> {
    await this.dataSource.transaction(async (manager) => {
      const charactersRepository = manager.getRepository(Character);
      const racesRepository = manager.getRepository(Race);
      const tagsRepository = manager.getRepository(Tag);
      const familiesRepository = manager.getRepository(Family);
      const familyMembersRepository = manager.getRepository(FamilyMember);
      const familyRelationshipsRepository =
        manager.getRepository(FamilyRelationship);

      const character = await charactersRepository.findOne({
        where: { id },
        relations: {
          race: { category: true, tags: true },
          tags: true,
          family: true,
          secondaryFamily: true,
        },
      });
      if (!character) {
        throw new NotFoundException('Personagem não encontrado.');
      }

      if (dto.name !== undefined) {
        character.name = dto.name;
      }
      if (dto.referenceImage !== undefined) {
        character.referenceImage = dto.referenceImage;
      }
      if (dto.description !== undefined) {
        character.description = dto.description;
      }
      if (dto.privateInformation !== undefined) {
        character.privateInformation = dto.privateInformation;
      }
      if (dto.isDead !== undefined) {
        character.isDead = dto.isDead;
      }
      if (dto.raceId !== undefined) {
        character.race = dto.raceId
          ? await this.findRaceById(dto.raceId, racesRepository)
          : null;
      }
      if (dto.tagIds !== undefined) {
        character.tags =
          dto.tagIds.length > 0
            ? await this.findTagsByIds(dto.tagIds, tagsRepository)
            : [];
      }

      const nextFamilyId =
        dto.familyId !== undefined
          ? (dto.familyId ?? null)
          : (character.family?.id ?? null);
      const nextSecondaryFamilyId =
        dto.secondaryFamilyId !== undefined
          ? (dto.secondaryFamilyId ?? null)
          : (character.secondaryFamily?.id ?? null);
      this.assertFamiliesAreDifferent(nextFamilyId, nextSecondaryFamilyId);

      if (dto.familyId !== undefined) {
        const newFamily = dto.familyId
          ? await this.findFamilyById(dto.familyId, familiesRepository)
          : null;
        if (character.family?.id !== (newFamily?.id ?? null)) {
          if (character.family) {
            await this.detachCharacterFromFamily(
              character.id,
              character.family.id,
              familyMembersRepository,
              familyRelationshipsRepository,
            );
          }
          character.family = newFamily;
        }
      }

      if (dto.secondaryFamilyId !== undefined) {
        const newSecondaryFamily = dto.secondaryFamilyId
          ? await this.findFamilyById(dto.secondaryFamilyId, familiesRepository)
          : null;
        if (
          character.secondaryFamily?.id !== (newSecondaryFamily?.id ?? null)
        ) {
          if (character.secondaryFamily) {
            await this.detachCharacterFromFamily(
              character.id,
              character.secondaryFamily.id,
              familyMembersRepository,
              familyRelationshipsRepository,
            );
          }
          character.secondaryFamily = newSecondaryFamily;
        }
      }

      await charactersRepository.save(character);
    });

    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException('Personagem não encontrado.');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.charactersRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Personagem não encontrado.');
    }
  }
}
