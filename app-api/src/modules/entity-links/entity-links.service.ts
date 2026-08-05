import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { loadOrderedTagsMap } from '../../common/utils/ordered-tags.util';
import { Training } from '../trainings/entities/training.entity';
import { TrainingTag } from '../trainings/entities/training-tag.entity';
import { Talent } from '../talents/entities/talent.entity';
import { TalentTag } from '../talents/entities/talent-tag.entity';
import { Technique } from '../techniques/entities/technique.entity';
import { TechniqueTag } from '../techniques/entities/technique-tag.entity';
import { Spell } from '../spells/entities/spell.entity';
import { SpellTag } from '../spells/entities/spell-tag.entity';
import { Characteristic } from '../characteristics/entities/characteristic.entity';
import { CharacteristicTag } from '../characteristics/entities/characteristic-tag.entity';
import { Biography } from '../biographies/entities/biography.entity';
import { BiographyTag } from '../biographies/entities/biography-tag.entity';
import { EntityLink } from './entities/entity-link.entity';
import { EntityLinkType } from './enums/entity-link-type.enum';
import { ReferenceableEntityType } from './enums/referenceable-entity-type.enum';
import { EntityReferenceInputDto } from './dto/entity-reference-input.dto';
import { EntityReferenceResponseDto } from './dto/entity-reference-response.dto';

export interface ResolvedReference {
  entityType: ReferenceableEntityType;
  id: string;
  name: string;
}

type OwnerColumn =
  | 'ownerTraining'
  | 'ownerTalent'
  | 'ownerTechnique'
  | 'ownerSpell'
  | 'ownerCharacteristic'
  | 'ownerBiography';

type TargetColumn =
  | 'targetTraining'
  | 'targetTalent'
  | 'targetTechnique'
  | 'targetSpell'
  | 'targetCharacteristic'
  | 'targetBiography';

@Injectable()
export class EntityLinksService {
  constructor(
    @InjectRepository(EntityLink)
    private readonly entityLinksRepository: Repository<EntityLink>,
    @InjectRepository(Training)
    private readonly trainingsRepository: Repository<Training>,
    @InjectRepository(TrainingTag)
    private readonly trainingTagsRepository: Repository<TrainingTag>,
    @InjectRepository(Talent)
    private readonly talentsRepository: Repository<Talent>,
    @InjectRepository(TalentTag)
    private readonly talentTagsRepository: Repository<TalentTag>,
    @InjectRepository(Technique)
    private readonly techniquesRepository: Repository<Technique>,
    @InjectRepository(TechniqueTag)
    private readonly techniqueTagsRepository: Repository<TechniqueTag>,
    @InjectRepository(Spell)
    private readonly spellsRepository: Repository<Spell>,
    @InjectRepository(SpellTag)
    private readonly spellTagsRepository: Repository<SpellTag>,
    @InjectRepository(Characteristic)
    private readonly characteristicsRepository: Repository<Characteristic>,
    @InjectRepository(CharacteristicTag)
    private readonly characteristicTagsRepository: Repository<CharacteristicTag>,
    @InjectRepository(Biography)
    private readonly biographiesRepository: Repository<Biography>,
    @InjectRepository(BiographyTag)
    private readonly biographyTagsRepository: Repository<BiographyTag>,
  ) {}

  private repositoryFor(
    entityType: ReferenceableEntityType,
  ): Repository<
    Training | Talent | Technique | Spell | Characteristic | Biography
  > {
    switch (entityType) {
      case ReferenceableEntityType.TRAINING:
        return this.trainingsRepository;
      case ReferenceableEntityType.TALENT:
        return this.talentsRepository;
      case ReferenceableEntityType.TECHNIQUE:
        return this.techniquesRepository;
      case ReferenceableEntityType.SPELL:
        return this.spellsRepository;
      case ReferenceableEntityType.CHARACTERISTIC:
        return this.characteristicsRepository;
      case ReferenceableEntityType.BIOGRAPHY:
        return this.biographiesRepository;
    }
  }

  private ownerColumnFor(entityType: ReferenceableEntityType): OwnerColumn {
    switch (entityType) {
      case ReferenceableEntityType.TRAINING:
        return 'ownerTraining';
      case ReferenceableEntityType.TALENT:
        return 'ownerTalent';
      case ReferenceableEntityType.TECHNIQUE:
        return 'ownerTechnique';
      case ReferenceableEntityType.SPELL:
        return 'ownerSpell';
      case ReferenceableEntityType.CHARACTERISTIC:
        return 'ownerCharacteristic';
      case ReferenceableEntityType.BIOGRAPHY:
        return 'ownerBiography';
    }
  }

  private targetColumnFor(entityType: ReferenceableEntityType): TargetColumn {
    switch (entityType) {
      case ReferenceableEntityType.TRAINING:
        return 'targetTraining';
      case ReferenceableEntityType.TALENT:
        return 'targetTalent';
      case ReferenceableEntityType.TECHNIQUE:
        return 'targetTechnique';
      case ReferenceableEntityType.SPELL:
        return 'targetSpell';
      case ReferenceableEntityType.CHARACTERISTIC:
        return 'targetCharacteristic';
      case ReferenceableEntityType.BIOGRAPHY:
        return 'targetBiography';
    }
  }

  async resolveReferences(
    refs: EntityReferenceInputDto[],
  ): Promise<ResolvedReference[]> {
    if (refs.length === 0) {
      return [];
    }

    const idsByType = new Map<ReferenceableEntityType, string[]>();
    for (const ref of refs) {
      const ids = idsByType.get(ref.entityType) ?? [];
      ids.push(ref.id);
      idsByType.set(ref.entityType, ids);
    }

    const resolvedByKey = new Map<string, ResolvedReference>();

    for (const [entityType, ids] of idsByType) {
      const uniqueIds = [...new Set(ids)];
      const repository = this.repositoryFor(entityType);
      const entities = await repository.findBy({ id: In(uniqueIds) });
      if (entities.length !== uniqueIds.length) {
        throw new NotFoundException(
          'Um ou mais itens referenciados em Aprimorado de/Requisitos/Habilidades Adicionais não foram encontrados.',
        );
      }
      for (const entity of entities) {
        resolvedByKey.set(`${entityType}:${entity.id}`, {
          entityType,
          id: entity.id,
          name: entity.name,
        });
      }
    }

    return refs.map((ref) => {
      const resolved = resolvedByKey.get(`${ref.entityType}:${ref.id}`);
      if (!resolved) {
        throw new NotFoundException(
          'Um ou mais itens referenciados em Aprimorado de/Requisitos/Habilidades Adicionais não foram encontrados.',
        );
      }
      return resolved;
    });
  }

  validateLists(params: {
    ownerEntityType: ReferenceableEntityType;
    ownerId?: string;
    improvedFrom: EntityReferenceInputDto[];
    requirements: EntityReferenceInputDto[];
    additionalAbilities?: EntityReferenceInputDto[];
  }): void {
    const { ownerEntityType, ownerId, improvedFrom, requirements } = params;
    const additionalAbilities = params.additionalAbilities ?? [];
    const key = (ref: EntityReferenceInputDto) => `${ref.entityType}:${ref.id}`;

    if (ownerId) {
      for (const ref of [
        ...improvedFrom,
        ...requirements,
        ...additionalAbilities,
      ]) {
        if (ref.entityType === ownerEntityType && ref.id === ownerId) {
          throw new ConflictException(
            'Um item não pode ser Aprimorado de/Requisito/Habilidade Adicional de si mesmo.',
          );
        }
      }
    }

    const improvedFromKeys = new Set<string>();
    for (const ref of improvedFrom) {
      const refKey = key(ref);
      if (improvedFromKeys.has(refKey)) {
        throw new ConflictException(
          'Um item não pode ser adicionado duas vezes à mesma lista.',
        );
      }
      improvedFromKeys.add(refKey);
    }

    const requirementsKeys = new Set<string>();
    for (const ref of requirements) {
      const refKey = key(ref);
      if (requirementsKeys.has(refKey)) {
        throw new ConflictException(
          'Um item não pode ser adicionado duas vezes à mesma lista.',
        );
      }
      requirementsKeys.add(refKey);
    }

    const additionalAbilitiesKeys = new Set<string>();
    for (const ref of additionalAbilities) {
      const refKey = key(ref);
      if (additionalAbilitiesKeys.has(refKey)) {
        throw new ConflictException(
          'Um item não pode ser adicionado duas vezes à mesma lista.',
        );
      }
      additionalAbilitiesKeys.add(refKey);
    }

    const mutualExclusivityMessage =
      'Um item não pode estar em mais de uma das listas Aprimorado de, Requisitos e Habilidades Adicionais ao mesmo tempo.';

    for (const refKey of improvedFromKeys) {
      if (requirementsKeys.has(refKey)) {
        throw new ConflictException(mutualExclusivityMessage);
      }
      if (additionalAbilitiesKeys.has(refKey)) {
        throw new ConflictException(mutualExclusivityMessage);
      }
    }

    for (const refKey of requirementsKeys) {
      if (additionalAbilitiesKeys.has(refKey)) {
        throw new ConflictException(mutualExclusivityMessage);
      }
    }
  }

  async replaceLinks(
    ownerEntityType: ReferenceableEntityType,
    ownerId: string,
    linkType: EntityLinkType,
    refs: EntityReferenceInputDto[],
  ): Promise<void> {
    const ownerColumn = this.ownerColumnFor(ownerEntityType);

    const deleteCriteria: Record<string, unknown> = {
      linkType,
      [ownerColumn]: { id: ownerId },
    };
    await this.entityLinksRepository.delete(deleteCriteria);

    if (refs.length === 0) {
      return;
    }

    const links = refs.map((ref) => {
      const targetColumn = this.targetColumnFor(ref.entityType);
      const linkData: Record<string, unknown> = {
        linkType,
        [ownerColumn]: { id: ownerId },
        [targetColumn]: { id: ref.id },
      };
      return this.entityLinksRepository.create(
        linkData as DeepPartial<EntityLink>,
      );
    });

    await this.entityLinksRepository.save(links);
  }

  async loadReferencesFor(
    ownerEntityType: ReferenceableEntityType,
    ownerId: string,
  ): Promise<{
    improvedFrom: EntityReferenceResponseDto[];
    requirements: EntityReferenceResponseDto[];
    additionalAbilities: EntityReferenceResponseDto[];
  }> {
    const ownerColumn = this.ownerColumnFor(ownerEntityType);

    const whereCriteria: Record<string, unknown> = {
      [ownerColumn]: { id: ownerId },
    };

    const links = await this.entityLinksRepository.find({
      where: whereCriteria as FindOptionsWhere<EntityLink>,
      relations: {
        targetTraining: true,
        targetTalent: true,
        targetTechnique: true,
        targetSpell: true,
        targetCharacteristic: true,
        targetBiography: true,
      },
    });

    const trainingTagsById = await loadOrderedTagsMap(
      this.trainingTagsRepository,
      links
        .map((link) => link.targetTraining?.id)
        .filter((linkId): linkId is string => linkId !== undefined),
      'training',
    );
    const talentTagsById = await loadOrderedTagsMap(
      this.talentTagsRepository,
      links
        .map((link) => link.targetTalent?.id)
        .filter((linkId): linkId is string => linkId !== undefined),
      'talent',
    );
    const techniqueTagsById = await loadOrderedTagsMap(
      this.techniqueTagsRepository,
      links
        .map((link) => link.targetTechnique?.id)
        .filter((linkId): linkId is string => linkId !== undefined),
      'technique',
    );
    const spellTagsById = await loadOrderedTagsMap(
      this.spellTagsRepository,
      links
        .map((link) => link.targetSpell?.id)
        .filter((linkId): linkId is string => linkId !== undefined),
      'spell',
    );
    const characteristicTagsById = await loadOrderedTagsMap(
      this.characteristicTagsRepository,
      links
        .map((link) => link.targetCharacteristic?.id)
        .filter((linkId): linkId is string => linkId !== undefined),
      'characteristic',
    );
    const biographyTagsById = await loadOrderedTagsMap(
      this.biographyTagsRepository,
      links
        .map((link) => link.targetBiography?.id)
        .filter((linkId): linkId is string => linkId !== undefined),
      'biography',
    );

    for (const link of links) {
      if (link.targetTraining) {
        link.targetTraining.tags =
          trainingTagsById.get(link.targetTraining.id) ?? [];
      }
      if (link.targetTalent) {
        link.targetTalent.tags = talentTagsById.get(link.targetTalent.id) ?? [];
      }
      if (link.targetTechnique) {
        link.targetTechnique.tags =
          techniqueTagsById.get(link.targetTechnique.id) ?? [];
      }
      if (link.targetSpell) {
        link.targetSpell.tags = spellTagsById.get(link.targetSpell.id) ?? [];
      }
      if (link.targetCharacteristic) {
        link.targetCharacteristic.tags =
          characteristicTagsById.get(link.targetCharacteristic.id) ?? [];
      }
      if (link.targetBiography) {
        link.targetBiography.tags =
          biographyTagsById.get(link.targetBiography.id) ?? [];
      }
    }

    const toResponse = (link: EntityLink): EntityReferenceResponseDto => {
      if (link.targetTraining) {
        return EntityReferenceResponseDto.fromResolved(
          link.targetTraining,
          ReferenceableEntityType.TRAINING,
        );
      }
      if (link.targetTalent) {
        return EntityReferenceResponseDto.fromResolved(
          link.targetTalent,
          ReferenceableEntityType.TALENT,
        );
      }
      if (link.targetTechnique) {
        return EntityReferenceResponseDto.fromResolved(
          link.targetTechnique,
          ReferenceableEntityType.TECHNIQUE,
        );
      }
      if (link.targetSpell) {
        return EntityReferenceResponseDto.fromResolved(
          link.targetSpell,
          ReferenceableEntityType.SPELL,
        );
      }
      if (link.targetBiography) {
        return EntityReferenceResponseDto.fromResolved(
          link.targetBiography,
          ReferenceableEntityType.BIOGRAPHY,
        );
      }
      return EntityReferenceResponseDto.fromResolved(
        link.targetCharacteristic as Characteristic,
        ReferenceableEntityType.CHARACTERISTIC,
      );
    };

    const sortByName = (
      a: EntityReferenceResponseDto,
      b: EntityReferenceResponseDto,
    ) => a.name.localeCompare(b.name, 'pt-BR');

    const improvedFrom = links
      .filter((link) => link.linkType === EntityLinkType.IMPROVED_FROM)
      .map(toResponse)
      .sort(sortByName);

    const requirements = links
      .filter((link) => link.linkType === EntityLinkType.REQUIREMENT)
      .map(toResponse)
      .sort(sortByName);

    const additionalAbilities = links
      .filter((link) => link.linkType === EntityLinkType.ADDITIONAL_ABILITY)
      .map(toResponse)
      .sort(sortByName);

    return { improvedFrom, requirements, additionalAbilities };
  }
}
