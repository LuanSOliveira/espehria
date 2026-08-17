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
import {
  createOrderedTagJunctions,
  loadOrderedTagsForOwner,
  loadOrderedTagsMap,
  replaceOrderedTagJunctions,
} from '../../common/utils/ordered-tags.util';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { FindCharactersQueryDto } from './dto/find-characters-query.dto';
import { Character } from './entities/character.entity';
import { CharacterTag } from './entities/character-tag.entity';
import { Race } from '../races/entities/race.entity';
import { RaceTag } from '../races/entities/race-tag.entity';
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
    @InjectRepository(CharacterTag)
    private readonly characterTagsRepository: Repository<CharacterTag>,
    @InjectRepository(Race)
    private readonly racesRepository: Repository<Race>,
    @InjectRepository(RaceTag)
    private readonly raceTagsRepository: Repository<RaceTag>,
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

  async findById(id: string): Promise<Character | null> {
    const character = await this.charactersRepository.findOne({
      where: { id },
      relations: {
        race: { category: true },
        family: true,
        secondaryFamily: true,
      },
    });
    if (!character) {
      return null;
    }
    character.tags = await loadOrderedTagsForOwner(
      this.characterTagsRepository,
      id,
      'character',
    );
    if (character.race) {
      character.race.tags = await loadOrderedTagsForOwner(
        this.raceTagsRepository,
        character.race.id,
        'race',
      );
    }
    return character;
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
    raceTagsRepository: Repository<RaceTag> = this.raceTagsRepository,
  ): Promise<Race> {
    const race = await repository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!race) {
      throw new NotFoundException('Raça não encontrada.');
    }
    race.tags = await loadOrderedTagsForOwner(raceTagsRepository, id, 'race');
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
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    return uniqueIds.map((id) => tagsById.get(id)!);
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
      family,
      secondaryFamily,
    });

    const savedCharacter = await this.charactersRepository.save(character);
    await createOrderedTagJunctions(
      this.characterTagsRepository,
      'character',
      savedCharacter,
      tags,
    );
    savedCharacter.tags = tags;
    return savedCharacter;
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

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'character_tags',
          'character_tag_filter',
          'character_tag_filter.character_id = character.id AND character_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('character.id')
        .having('COUNT(DISTINCT character_tag_filter.tag_id) = :tagCount', {
          tagCount: uniqueTagIds.length,
        });
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada, contando as linhas resultantes
    // (uma por personagem). Sem filtro de tags, `getCount()` é suficiente e
    // evita trazer todos os ids para a aplicação só para contá-los. Esse
    // filtro fica restrito a esta query de paginação (seleção de ids) — a
    // query subsequente que carrega `race`/`category` não é afetada.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('character.id').getRawMany()).length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['character.id', 'character.name'])
      .orderBy('character.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const characters = await this.charactersRepository.find({
      where: { id: In(ids.map((character) => character.id)) },
      relations: { race: { category: true } },
      order: { name: 'ASC' },
    });

    const tagsByCharacterId = await loadOrderedTagsMap(
      this.characterTagsRepository,
      characters.map((character) => character.id),
      'character',
    );
    const raceIds = characters
      .map((character) => character.race?.id)
      .filter((raceId): raceId is string => raceId !== undefined);
    const tagsByRaceId = await loadOrderedTagsMap(
      this.raceTagsRepository,
      raceIds,
      'race',
    );
    for (const character of characters) {
      character.tags = tagsByCharacterId.get(character.id) ?? [];
      if (character.race) {
        character.race.tags = tagsByRaceId.get(character.race.id) ?? [];
      }
    }

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
      const characterTagsRepository = manager.getRepository(CharacterTag);
      const racesRepository = manager.getRepository(Race);
      const tagsRepository = manager.getRepository(Tag);
      const familiesRepository = manager.getRepository(Family);
      const familyMembersRepository = manager.getRepository(FamilyMember);
      const familyRelationshipsRepository =
        manager.getRepository(FamilyRelationship);

      const character = await charactersRepository.findOne({
        where: { id },
        relations: {
          race: { category: true },
          family: true,
          secondaryFamily: true,
        },
      });
      if (!character) {
        throw new NotFoundException('Personagem não encontrado.');
      }
      character.tags = await loadOrderedTagsForOwner(
        characterTagsRepository,
        id,
        'character',
      );
      if (character.race) {
        character.race.tags = await loadOrderedTagsForOwner(
          this.raceTagsRepository,
          character.race.id,
          'race',
        );
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
      let tags = character.tags;
      if (dto.tagIds !== undefined) {
        tags =
          dto.tagIds.length > 0
            ? await this.findTagsByIds(dto.tagIds, tagsRepository)
            : [];
        await replaceOrderedTagJunctions(
          characterTagsRepository,
          'character',
          character,
          tags,
        );
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
