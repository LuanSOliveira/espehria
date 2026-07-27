import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { FindCharactersQueryDto } from './dto/find-characters-query.dto';
import { CharacterKinshipInputDto } from './dto/character-kinship-input.dto';
import { Character } from './entities/character.entity';
import { CharacterKinship } from './entities/character-kinship.entity';
import { Race } from '../races/entities/race.entity';
import { Tag } from '../tags/entities/tag.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Organization } from '../organizations/entities/organization.entity';

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
    @InjectRepository(CharacterKinship)
    private readonly characterKinshipsRepository: Repository<CharacterKinship>,
    @InjectRepository(Race)
    private readonly racesRepository: Repository<Race>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(OrganizationMember)
    private readonly organizationMembersRepository: Repository<OrganizationMember>,
  ) {}

  findById(id: string): Promise<Character | null> {
    return this.charactersRepository.findOne({
      where: { id },
      relations: {
        race: { category: true, tags: true },
        tags: true,
        kinships: { relative: true },
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

  private async findRaceById(id: string): Promise<Race> {
    const race = await this.racesRepository.findOne({
      where: { id },
      relations: { category: true, tags: true },
    });
    if (!race) {
      throw new NotFoundException('Raça não encontrada.');
    }
    return race;
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
        'Um ou mais personagens parentes não foram encontrados.',
      );
    }
    return characters;
  }

  private assertNoDuplicateRelatives(
    kinships: CharacterKinshipInputDto[],
  ): void {
    const relativeIds = kinships.map((kinship) => kinship.relativeId);
    if (new Set(relativeIds).size !== relativeIds.length) {
      throw new BadRequestException(
        'Não é permitido cadastrar o mesmo parente mais de uma vez para o personagem.',
      );
    }
  }

  private assertNoSelfKinship(
    characterId: string | undefined,
    kinships: CharacterKinshipInputDto[],
  ): void {
    if (!characterId) {
      return;
    }
    const hasSelfReference = kinships.some(
      (kinship) => kinship.relativeId === characterId,
    );
    if (hasSelfReference) {
      throw new BadRequestException(
        'Um personagem não pode ser cadastrado como parente de si mesmo.',
      );
    }
  }

  private async buildKinships(
    characterId: string | undefined,
    kinships: CharacterKinshipInputDto[],
  ): Promise<CharacterKinship[]> {
    this.assertNoDuplicateRelatives(kinships);
    this.assertNoSelfKinship(characterId, kinships);

    const relativeIds = kinships.map((kinship) => kinship.relativeId);
    const relatives =
      relativeIds.length > 0 ? await this.findCharactersByIds(relativeIds) : [];
    const relativesById = new Map(
      relatives.map((relative) => [relative.id, relative]),
    );

    return kinships.map((input) => {
      const relative = relativesById.get(input.relativeId);
      if (!relative) {
        throw new NotFoundException(
          'Um ou mais personagens parentes não foram encontrados.',
        );
      }
      return this.characterKinshipsRepository.create({
        kinship: input.kinship,
        relative,
      });
    });
  }

  // Reassigning `character.kinships` inteiro e deixando o cascade save cuidar da
  // remoção via orphanedRowAction falha com violação de not-null: o TypeORM tenta
  // primeiro um UPDATE setando "character_id" = NULL nas linhas órfãs antes de
  // excluí-las, o que quebra a coluna NOT NULL. Por isso os parentescos removidos,
  // atualizados e adicionados são sincronizados diretamente pelo repositório.
  private async syncKinships(
    character: Character,
    kinships: CharacterKinshipInputDto[],
  ): Promise<void> {
    this.assertNoDuplicateRelatives(kinships);
    this.assertNoSelfKinship(character.id, kinships);

    const relativeIds = kinships.map((kinship) => kinship.relativeId);
    const relatives =
      relativeIds.length > 0 ? await this.findCharactersByIds(relativeIds) : [];
    const relativesById = new Map(
      relatives.map((relative) => [relative.id, relative]),
    );

    const existingByRelativeId = new Map(
      character.kinships.map((kinship) => [kinship.relative.id, kinship]),
    );

    const keptIds = new Set<string>();
    const toSave: CharacterKinship[] = [];

    for (const input of kinships) {
      const relative = relativesById.get(input.relativeId);
      if (!relative) {
        throw new NotFoundException(
          'Um ou mais personagens parentes não foram encontrados.',
        );
      }

      const existing = existingByRelativeId.get(input.relativeId);
      if (existing) {
        keptIds.add(existing.id);
        if (existing.kinship !== input.kinship) {
          existing.kinship = input.kinship;
          toSave.push(existing);
        }
        continue;
      }

      toSave.push(
        this.characterKinshipsRepository.create({
          kinship: input.kinship,
          character,
          relative,
        }),
      );
    }

    const toRemove = character.kinships.filter(
      (kinship) => !keptIds.has(kinship.id),
    );

    if (toRemove.length > 0) {
      await this.characterKinshipsRepository.remove(toRemove);
    }
    if (toSave.length > 0) {
      await this.characterKinshipsRepository.save(toSave);
    }
  }

  async create(dto: CreateCharacterDto): Promise<Character> {
    const race = dto.raceId ? await this.findRaceById(dto.raceId) : null;

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const kinships =
      dto.kinships && dto.kinships.length > 0
        ? await this.buildKinships(undefined, dto.kinships)
        : [];

    const character = this.charactersRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      description: dto.description ?? null,
      isDead: dto.isDead ?? false,
      race,
      tags,
      kinships,
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
    const character = await this.findById(id);
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
    if (dto.isDead !== undefined) {
      character.isDead = dto.isDead;
    }
    if (dto.raceId !== undefined) {
      character.race = dto.raceId ? await this.findRaceById(dto.raceId) : null;
    }
    if (dto.tagIds !== undefined) {
      character.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    await this.charactersRepository.save(character);

    if (dto.kinships !== undefined) {
      await this.syncKinships(character, dto.kinships);
    }

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
