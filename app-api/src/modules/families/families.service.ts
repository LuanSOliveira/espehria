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
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FindFamiliesQueryDto } from './dto/find-families-query.dto';
import { FamilyMemberInputDto } from './dto/family-member-input.dto';
import { FamilyRelationshipInputDto } from './dto/family-relationship-input.dto';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { FamilyRelationship } from './entities/family-relationship.entity';
import { FamilyRelationshipType } from './enums/family-relationship-type.enum';
import { Tag } from '../tags/entities/tag.entity';
import { Character } from '../characters/entities/character.entity';

export interface PaginatedFamilies {
  data: Family[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly familyMembersRepository: Repository<FamilyMember>,
    @InjectRepository(FamilyRelationship)
    private readonly familyRelationshipsRepository: Repository<FamilyRelationship>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Character)
    private readonly charactersRepository: Repository<Character>,
    private readonly dataSource: DataSource,
  ) {}

  private findFamilyWithRelations(
    id: string,
    repository: Repository<Family> = this.familiesRepository,
  ): Promise<Family | null> {
    return repository.findOne({
      where: { id },
      relations: {
        tags: true,
        members: { character: true },
        relationships: { sourceCharacter: true, targetCharacter: true },
      },
    });
  }

  findById(id: string): Promise<Family | null> {
    return this.findFamilyWithRelations(id);
  }

  async findLooseCharacters(family: Family): Promise<Character[]> {
    const memberCharacterIds = new Set(
      (family.members ?? []).map((member) => member.character.id),
    );

    const characters = await this.charactersRepository.find({
      where: [
        { family: { id: family.id } },
        { secondaryFamily: { id: family.id } },
      ],
    });

    return characters.filter(
      (character) => !memberCharacterIds.has(character.id),
    );
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

  private async findCharactersByIds(
    ids: string[],
    repository: Repository<Character> = this.charactersRepository,
  ): Promise<Character[]> {
    const uniqueIds = [...new Set(ids)];
    const characters = await repository.find({
      where: { id: In(uniqueIds) },
      relations: { family: true, secondaryFamily: true },
    });
    if (characters.length !== uniqueIds.length) {
      throw new NotFoundException(
        'Um ou mais personagens membros não foram encontrados.',
      );
    }
    return characters;
  }

  private assertNoDuplicateMembers(members: FamilyMemberInputDto[]): void {
    const characterIds = members.map((member) => member.characterId);
    if (new Set(characterIds).size !== characterIds.length) {
      throw new BadRequestException(
        'Não é permitido cadastrar o mesmo personagem mais de uma vez na árvore genealógica.',
      );
    }
  }

  private assertNoSelfRelationship(
    relationships: FamilyRelationshipInputDto[],
  ): void {
    const hasSelfReference = relationships.some(
      (relationship) =>
        relationship.sourceCharacterId === relationship.targetCharacterId,
    );
    if (hasSelfReference) {
      throw new BadRequestException(
        'Um personagem não pode ter um vínculo de parentesco consigo mesmo.',
      );
    }
  }

  private assertNoDuplicateRelationshipPairs(
    relationships: FamilyRelationshipInputDto[],
  ): void {
    const seen = new Map<string, FamilyRelationshipType>();
    for (const relationship of relationships) {
      const key = `${relationship.sourceCharacterId}:${relationship.targetCharacterId}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          'Não é permitido cadastrar o mesmo vínculo de parentesco mais de uma vez.',
        );
      }

      const invertedKey = `${relationship.targetCharacterId}:${relationship.sourceCharacterId}`;
      const invertedType = seen.get(invertedKey);
      if (invertedType === relationship.type) {
        if (relationship.type === FamilyRelationshipType.SPOUSE) {
          throw new BadRequestException(
            'O vínculo de cônjuge entre estes personagens já foi cadastrado.',
          );
        }
        if (relationship.type === FamilyRelationshipType.PARENT) {
          throw new BadRequestException(
            'Um personagem não pode ser simultaneamente ascendente e descendente do outro.',
          );
        }
      }

      seen.set(key, relationship.type);
    }
  }

  private assertRelationshipsWithinMembers(
    relationships: FamilyRelationshipInputDto[],
    memberCharacterIds: Set<string>,
  ): void {
    const hasCharacterOutsideMembers = relationships.some(
      (relationship) =>
        !memberCharacterIds.has(relationship.sourceCharacterId) ||
        !memberCharacterIds.has(relationship.targetCharacterId),
    );
    if (hasCharacterOutsideMembers) {
      throw new BadRequestException(
        'Só é possível criar vínculos entre personagens já adicionados como membros da árvore.',
      );
    }
  }

  private async buildMembers(
    members: FamilyMemberInputDto[],
    charactersRepository: Repository<Character> = this.charactersRepository,
    familyMembersRepository: Repository<FamilyMember> = this
      .familyMembersRepository,
  ): Promise<FamilyMember[]> {
    this.assertNoDuplicateMembers(members);

    const characterIds = members.map((member) => member.characterId);
    const characters =
      characterIds.length > 0
        ? await this.findCharactersByIds(characterIds, charactersRepository)
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
      return familyMembersRepository.create({
        positionX: input.positionX,
        positionY: input.positionY,
        character,
      });
    });
  }

  private async buildRelationships(
    relationships: FamilyRelationshipInputDto[],
    memberCharacterIds: Set<string>,
    charactersRepository: Repository<Character> = this.charactersRepository,
    familyRelationshipsRepository: Repository<FamilyRelationship> = this
      .familyRelationshipsRepository,
  ): Promise<FamilyRelationship[]> {
    this.assertNoSelfRelationship(relationships);
    this.assertNoDuplicateRelationshipPairs(relationships);
    this.assertRelationshipsWithinMembers(relationships, memberCharacterIds);

    const characterIds = relationships.flatMap((relationship) => [
      relationship.sourceCharacterId,
      relationship.targetCharacterId,
    ]);
    const characters =
      characterIds.length > 0
        ? await this.findCharactersByIds(characterIds, charactersRepository)
        : [];
    const charactersById = new Map(
      characters.map((character) => [character.id, character]),
    );

    return relationships.map((input) => {
      const sourceCharacter = charactersById.get(input.sourceCharacterId);
      const targetCharacter = charactersById.get(input.targetCharacterId);
      if (!sourceCharacter || !targetCharacter) {
        throw new NotFoundException(
          'Um ou mais personagens membros não foram encontrados.',
        );
      }
      return familyRelationshipsRepository.create({
        type: input.type,
        sourceCharacter,
        targetCharacter,
      });
    });
  }

  // Aplica a regra de negócio de sincronização família primária/secundária: se o
  // personagem ainda não tem `family`, define `family` = esta família; se já tem uma
  // `family` diferente, define `secondaryFamily` = esta família (sem sobrescrever a
  // primária); se já é `family` ou `secondaryFamily` desta família, não altera nada.
  // Se o personagem já estiver associado a duas famílias diferentes desta, lança
  // exceção em vez de sobrescrever silenciosamente.
  private async applyFamilyAssignments(
    family: Family,
    characters: Character[],
    charactersRepository: Repository<Character> = this.charactersRepository,
  ): Promise<void> {
    const toSave: Character[] = [];
    for (const character of characters) {
      const alreadyPrimary = character.family?.id === family.id;
      const alreadySecondary = character.secondaryFamily?.id === family.id;
      if (alreadyPrimary || alreadySecondary) {
        continue;
      }
      if (!character.family) {
        character.family = family;
      } else if (!character.secondaryFamily) {
        character.secondaryFamily = family;
      } else {
        throw new BadRequestException(
          'O personagem já está associado ao número máximo de duas famílias.',
        );
      }
      toSave.push(character);
    }
    if (toSave.length > 0) {
      await charactersRepository.save(toSave);
    }
  }

  private async clearFamilyReferenceForCharacters(
    family: Family,
    characters: Character[],
    charactersRepository: Repository<Character> = this.charactersRepository,
  ): Promise<void> {
    const toSave: Character[] = [];
    for (const character of characters) {
      let changed = false;
      if (character.family?.id === family.id) {
        character.family = null;
        changed = true;
      }
      if (character.secondaryFamily?.id === family.id) {
        character.secondaryFamily = null;
        changed = true;
      }
      if (changed) {
        toSave.push(character);
      }
    }
    if (toSave.length > 0) {
      await charactersRepository.save(toSave);
    }
  }

  // Espelha `detachCharacterFromFamily` de `characters.service.ts`: ao remover o card
  // de um personagem da árvore desta família, os vínculos (`FamilyRelationship`) dessa
  // mesma família em que ele aparece como origem ou destino ficam órfãos e precisam ser
  // removidos junto, independentemente do que `dto.relationships` contiver.
  private async removeRelationshipsForCharacters(
    family: Family,
    characterIds: string[],
    familyRelationshipsRepository: Repository<FamilyRelationship> = this
      .familyRelationshipsRepository,
  ): Promise<void> {
    if (characterIds.length === 0) {
      return;
    }
    await familyRelationshipsRepository.delete({
      family: { id: family.id },
      sourceCharacter: { id: In(characterIds) },
    });
    await familyRelationshipsRepository.delete({
      family: { id: family.id },
      targetCharacter: { id: In(characterIds) },
    });
  }

  // Reassigning `family.members`/`family.relationships` inteiros e deixando o cascade
  // save cuidar da remoção via orphanedRowAction falha com violação de not-null (mesmo
  // problema documentado em OrganizationsService/CharactersService). Por isso membros e
  // vínculos removidos, atualizados e adicionados são sincronizados diretamente pelo
  // repositório.
  private async syncMembers(
    family: Family,
    members: FamilyMemberInputDto[],
    charactersRepository: Repository<Character> = this.charactersRepository,
    familyMembersRepository: Repository<FamilyMember> = this
      .familyMembersRepository,
    familyRelationshipsRepository: Repository<FamilyRelationship> = this
      .familyRelationshipsRepository,
  ): Promise<void> {
    this.assertNoDuplicateMembers(members);

    const characterIds = members.map((member) => member.characterId);
    const characters =
      characterIds.length > 0
        ? await this.findCharactersByIds(characterIds, charactersRepository)
        : [];
    const charactersById = new Map(
      characters.map((character) => [character.id, character]),
    );

    const existingByCharacterId = new Map(
      family.members.map((member) => [member.character.id, member]),
    );

    const keptIds = new Set<string>();
    const toSaveMembers: FamilyMember[] = [];

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
        if (
          existing.positionX !== input.positionX ||
          existing.positionY !== input.positionY
        ) {
          existing.positionX = input.positionX;
          existing.positionY = input.positionY;
          toSaveMembers.push(existing);
        }
        continue;
      }

      toSaveMembers.push(
        familyMembersRepository.create({
          positionX: input.positionX,
          positionY: input.positionY,
          family,
          character,
        }),
      );
    }

    const removedMembers = family.members.filter(
      (member) => !keptIds.has(member.id),
    );

    if (removedMembers.length > 0) {
      const removedCharacterIds = removedMembers.map(
        (member) => member.character.id,
      );
      const removedCharacters = await this.findCharactersByIds(
        removedCharacterIds,
        charactersRepository,
      );
      await this.clearFamilyReferenceForCharacters(
        family,
        removedCharacters,
        charactersRepository,
      );
      await this.removeRelationshipsForCharacters(
        family,
        removedCharacterIds,
        familyRelationshipsRepository,
      );
      await familyMembersRepository.remove(removedMembers);
    }
    if (toSaveMembers.length > 0) {
      await familyMembersRepository.save(toSaveMembers);
    }
    if (characters.length > 0) {
      await this.applyFamilyAssignments(
        family,
        characters,
        charactersRepository,
      );
    }
  }

  private async syncRelationships(
    family: Family,
    relationships: FamilyRelationshipInputDto[],
    memberCharacterIds: Set<string>,
    charactersRepository: Repository<Character> = this.charactersRepository,
    familyRelationshipsRepository: Repository<FamilyRelationship> = this
      .familyRelationshipsRepository,
  ): Promise<void> {
    this.assertNoSelfRelationship(relationships);
    this.assertNoDuplicateRelationshipPairs(relationships);
    this.assertRelationshipsWithinMembers(relationships, memberCharacterIds);

    const characterIds = relationships.flatMap((relationship) => [
      relationship.sourceCharacterId,
      relationship.targetCharacterId,
    ]);
    const characters =
      characterIds.length > 0
        ? await this.findCharactersByIds(characterIds, charactersRepository)
        : [];
    const charactersById = new Map(
      characters.map((character) => [character.id, character]),
    );

    const pairKey = (sourceId: string, targetId: string) =>
      `${sourceId}:${targetId}`;
    const existingByPair = new Map(
      family.relationships.map((relationship) => [
        pairKey(
          relationship.sourceCharacter.id,
          relationship.targetCharacter.id,
        ),
        relationship,
      ]),
    );

    const keptIds = new Set<string>();
    const toSaveRelationships: FamilyRelationship[] = [];

    for (const input of relationships) {
      const sourceCharacter = charactersById.get(input.sourceCharacterId);
      const targetCharacter = charactersById.get(input.targetCharacterId);
      if (!sourceCharacter || !targetCharacter) {
        throw new NotFoundException(
          'Um ou mais personagens membros não foram encontrados.',
        );
      }

      const existing = existingByPair.get(
        pairKey(input.sourceCharacterId, input.targetCharacterId),
      );
      if (existing) {
        keptIds.add(existing.id);
        if (existing.type !== input.type) {
          existing.type = input.type;
          toSaveRelationships.push(existing);
        }
        continue;
      }

      toSaveRelationships.push(
        familyRelationshipsRepository.create({
          type: input.type,
          family,
          sourceCharacter,
          targetCharacter,
        }),
      );
    }

    const toRemove = family.relationships.filter(
      (relationship) => !keptIds.has(relationship.id),
    );

    if (toRemove.length > 0) {
      await familyRelationshipsRepository.remove(toRemove);
    }
    if (toSaveRelationships.length > 0) {
      await familyRelationshipsRepository.save(toSaveRelationships);
    }
  }

  async create(dto: CreateFamilyDto): Promise<Family> {
    const savedId = await this.dataSource.transaction(async (manager) => {
      const familiesRepository = manager.getRepository(Family);
      const familyMembersRepository = manager.getRepository(FamilyMember);
      const familyRelationshipsRepository =
        manager.getRepository(FamilyRelationship);
      const tagsRepository = manager.getRepository(Tag);
      const charactersRepository = manager.getRepository(Character);

      const tags =
        dto.tagIds && dto.tagIds.length > 0
          ? await this.findTagsByIds(dto.tagIds, tagsRepository)
          : [];

      const members =
        dto.members && dto.members.length > 0
          ? await this.buildMembers(
              dto.members,
              charactersRepository,
              familyMembersRepository,
            )
          : [];

      const memberCharacterIds = new Set(
        (dto.members ?? []).map((member) => member.characterId),
      );

      const relationships =
        dto.relationships && dto.relationships.length > 0
          ? await this.buildRelationships(
              dto.relationships,
              memberCharacterIds,
              charactersRepository,
              familyRelationshipsRepository,
            )
          : [];

      const family = familiesRepository.create({
        name: dto.name,
        referenceImage: dto.referenceImage ?? null,
        description: dto.description ?? null,
        privateInformation: dto.privateInformation ?? null,
        classification: dto.classification,
        tags,
        members,
        relationships,
      });

      const saved = await familiesRepository.save(family);

      if (members.length > 0) {
        await this.applyFamilyAssignments(
          saved,
          members.map((member) => member.character),
          charactersRepository,
        );
      }

      return saved.id;
    });

    const created = await this.findById(savedId);
    if (!created) {
      throw new NotFoundException('Família não encontrada.');
    }
    return created;
  }

  async findAllPaginated(
    query: FindFamiliesQueryDto,
  ): Promise<PaginatedFamilies> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.familiesRepository.createQueryBuilder('family');

    if (query.name) {
      queryBuilder.andWhere('family.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['family.id', 'family.name'])
      .orderBy('family.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const families = await this.familiesRepository.find({
      where: { id: In(ids.map((family) => family.id)) },
      relations: { tags: true },
      order: { name: 'ASC' },
    });

    const familiesById = new Map(families.map((family) => [family.id, family]));
    const data = ids
      .map((family) => familiesById.get(family.id))
      .filter((family): family is Family => family !== undefined);

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateFamilyDto): Promise<Family> {
    await this.dataSource.transaction(async (manager) => {
      const familiesRepository = manager.getRepository(Family);
      const familyMembersRepository = manager.getRepository(FamilyMember);
      const familyRelationshipsRepository =
        manager.getRepository(FamilyRelationship);
      const tagsRepository = manager.getRepository(Tag);
      const charactersRepository = manager.getRepository(Character);

      const family = await this.findFamilyWithRelations(id, familiesRepository);
      if (!family) {
        throw new NotFoundException('Família não encontrada.');
      }

      if (dto.name !== undefined) {
        family.name = dto.name;
      }
      if (dto.referenceImage !== undefined) {
        family.referenceImage = dto.referenceImage;
      }
      if (dto.description !== undefined) {
        family.description = dto.description;
      }
      if (dto.privateInformation !== undefined) {
        family.privateInformation = dto.privateInformation;
      }
      if (dto.classification !== undefined) {
        family.classification = dto.classification;
      }
      if (dto.tagIds !== undefined) {
        family.tags =
          dto.tagIds.length > 0
            ? await this.findTagsByIds(dto.tagIds, tagsRepository)
            : [];
      }

      await familiesRepository.save(family);

      if (dto.members !== undefined) {
        await this.syncMembers(
          family,
          dto.members,
          charactersRepository,
          familyMembersRepository,
          familyRelationshipsRepository,
        );
      }
      if (dto.relationships !== undefined) {
        const memberCharacterIds = new Set(
          dto.members !== undefined
            ? dto.members.map((member) => member.characterId)
            : family.members.map((member) => member.character.id),
        );
        await this.syncRelationships(
          family,
          dto.relationships,
          memberCharacterIds,
          charactersRepository,
          familyRelationshipsRepository,
        );
      }
    });

    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException('Família não encontrada.');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.familiesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Família não encontrada.');
    }
  }
}
