import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { Training } from '../trainings/entities/training.entity';
import { Talent } from '../talents/entities/talent.entity';
import { Technique } from '../techniques/entities/technique.entity';
import { Spell } from '../spells/entities/spell.entity';
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
  | 'ownerSpell';

type TargetColumn =
  | 'targetTraining'
  | 'targetTalent'
  | 'targetTechnique'
  | 'targetSpell';

@Injectable()
export class EntityLinksService {
  constructor(
    @InjectRepository(EntityLink)
    private readonly entityLinksRepository: Repository<EntityLink>,
    @InjectRepository(Training)
    private readonly trainingsRepository: Repository<Training>,
    @InjectRepository(Talent)
    private readonly talentsRepository: Repository<Talent>,
    @InjectRepository(Technique)
    private readonly techniquesRepository: Repository<Technique>,
    @InjectRepository(Spell)
    private readonly spellsRepository: Repository<Spell>,
  ) {}

  private repositoryFor(
    entityType: ReferenceableEntityType,
  ): Repository<Training | Talent | Technique | Spell> {
    switch (entityType) {
      case ReferenceableEntityType.TRAINING:
        return this.trainingsRepository;
      case ReferenceableEntityType.TALENT:
        return this.talentsRepository;
      case ReferenceableEntityType.TECHNIQUE:
        return this.techniquesRepository;
      case ReferenceableEntityType.SPELL:
        return this.spellsRepository;
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
          'Um ou mais itens referenciados em Aprimorado de/Requisitos não foram encontrados.',
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
          'Um ou mais itens referenciados em Aprimorado de/Requisitos não foram encontrados.',
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
  }): void {
    const { ownerEntityType, ownerId, improvedFrom, requirements } = params;
    const key = (ref: EntityReferenceInputDto) => `${ref.entityType}:${ref.id}`;

    if (ownerId) {
      for (const ref of [...improvedFrom, ...requirements]) {
        if (ref.entityType === ownerEntityType && ref.id === ownerId) {
          throw new ConflictException(
            'Um item não pode ser Aprimorado de/Requisito de si mesmo.',
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

    for (const refKey of improvedFromKeys) {
      if (requirementsKeys.has(refKey)) {
        throw new ConflictException(
          'Um item não pode estar em Aprimorado de e em Requisitos ao mesmo tempo.',
        );
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
    await this.entityLinksRepository.delete(
      deleteCriteria as FindOptionsWhere<EntityLink>,
    );

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
  }> {
    const ownerColumn = this.ownerColumnFor(ownerEntityType);

    const whereCriteria: Record<string, unknown> = {
      [ownerColumn]: { id: ownerId },
    };

    const links = await this.entityLinksRepository.find({
      where: whereCriteria as FindOptionsWhere<EntityLink>,
      relations: {
        targetTraining: { tags: true },
        targetTalent: { tags: true },
        targetTechnique: { tags: true },
        targetSpell: { tags: true },
      },
    });

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
      return EntityReferenceResponseDto.fromResolved(
        link.targetSpell as Spell,
        ReferenceableEntityType.SPELL,
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

    return { improvedFrom, requirements };
  }
}
