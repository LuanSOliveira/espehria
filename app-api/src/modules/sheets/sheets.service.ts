import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import {
  loadOrderedTagsForOwner,
  loadOrderedTagsMap,
} from '../../common/utils/ordered-tags.util';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Race } from '../races/entities/race.entity';
import { RaceTag } from '../races/entities/race-tag.entity';
import { Characteristic } from '../characteristics/entities/characteristic.entity';
import { CharacteristicTag } from '../characteristics/entities/characteristic-tag.entity';
import { Training } from '../trainings/entities/training.entity';
import { TrainingTag } from '../trainings/entities/training-tag.entity';
import { Talent } from '../talents/entities/talent.entity';
import { TalentTag } from '../talents/entities/talent-tag.entity';
import { Biography } from '../biographies/entities/biography.entity';
import { BiographyTag } from '../biographies/entities/biography-tag.entity';
import { ImprovementFlaw } from '../improvement-flaws/entities/improvement-flaw.entity';
import { ImprovementFlawType } from '../improvement-flaw-types/entities/improvement-flaw-type.entity';
import { ImprovementFlawProperty } from '../improvement-flaw-properties/entities/improvement-flaw-property.entity';
import { ImprovementFlawCategory } from '../improvement-flaws/enums/improvement-flaw-category.enum';
import { Proficiency } from '../proficiencies/entities/proficiency.entity';
import { ProficiencyProperty } from '../proficiency-properties/entities/proficiency-property.entity';
import { Knowledge } from '../knowledges/entities/knowledge.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TagResponseDto } from '../tags/dto/tag-response.dto';
import { AuthProvider } from '../users/enums/auth-provider.enum';
import { User } from '../users/entities/user.entity';
import { EntityLinksService } from '../entity-links/entity-links.service';
import { EntityLinkType } from '../entity-links/enums/entity-link-type.enum';
import { ReferenceableEntityType } from '../entity-links/enums/referenceable-entity-type.enum';
import { EntityReferenceResponseDto } from '../entity-links/dto/entity-reference-response.dto';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { FindSheetsQueryDto } from './dto/find-sheets-query.dto';
import { LinkSheetBiographyDto } from './dto/link-sheet-biography.dto';
import { LinkSheetRaceDto } from './dto/link-sheet-race.dto';
import { ResolveProficiencyAdjustmentDto } from './dto/resolve-proficiency-adjustment.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { UpdateSheetKnowledgeNoteDto } from './dto/update-sheet-knowledge-note.dto';
import { AddCharacteristicExtraDto } from './dto/add-characteristic-extra.dto';
import { AddTrainingExtraDto } from './dto/add-training-extra.dto';
import { AddTalentExtraDto } from './dto/add-talent-extra.dto';
import { FillTrainingSlotDto } from './dto/fill-training-slot.dto';
import { FindSheetAbilityCandidatesQueryDto } from './dto/find-sheet-ability-candidates-query.dto';
import { AddSheetInventoryItemDto } from './dto/add-sheet-inventory-item.dto';
import { RemoveSheetInventoryItemDto } from './dto/remove-sheet-inventory-item.dto';
import { IncreaseSheetInventoryItemDto } from './dto/increase-sheet-inventory-item.dto';
import { FindSheetInventoryItemsQueryDto } from './dto/find-sheet-inventory-items-query.dto';
import type { SheetAbilityOriginEntityType } from './dto/sheet-ability-origin-response.dto';
import { Sheet } from './entities/sheet.entity';
import { SheetTrainingSlot } from './entities/sheet-training-slot.entity';
import { SheetAbilityExtra } from './entities/sheet-ability-extra.entity';
import { SheetInventoryItem } from './entities/sheet-inventory-item.entity';
import { SheetAbilityBucketType } from './enums/sheet-ability-bucket-type.enum';
import { SheetInventoryItemCategory } from './enums/sheet-inventory-item-category.enum';
import { UtilitiesService } from '../utilities/utilities.service';
import { CreateUtilityDto } from '../utilities/dto/create-utility.dto';
import { UtilityResponseDto } from '../utilities/dto/utility-response.dto';
import { ConsumablesService } from '../consumables/consumables.service';
import { CreateConsumableDto } from '../consumables/dto/create-consumable.dto';
import { ConsumableResponseDto } from '../consumables/dto/consumable-response.dto';
import { MaterialsService } from '../materials/materials.service';
import { CreateMaterialDto } from '../materials/dto/create-material.dto';
import { MaterialResponseDto } from '../materials/dto/material-response.dto';
import { AmmunitionService } from '../ammunition/ammunition.service';
import { CreateAmmunitionDto } from '../ammunition/dto/create-ammunition.dto';
import { AmmunitionResponseDto } from '../ammunition/dto/ammunition-response.dto';
import { WeaponsService } from '../weapons/weapons.service';
import { CreateWeaponDto } from '../weapons/dto/create-weapon.dto';
import { WeaponResponseDto } from '../weapons/dto/weapon-response.dto';
import { ArmorsService } from '../armors/armors.service';
import { CreateArmorDto } from '../armors/dto/create-armor.dto';
import { ArmorResponseDto } from '../armors/dto/armor-response.dto';
import { AccessoriesService } from '../accessories/accessories.service';
import { CreateAccessoryDto } from '../accessories/dto/create-accessory.dto';
import { AccessoryResponseDto } from '../accessories/dto/accessory-response.dto';
import { ShieldsService } from '../shields/shields.service';
import { CreateShieldDto } from '../shields/dto/create-shield.dto';
import { ShieldResponseDto } from '../shields/dto/shield-response.dto';
import {
  SheetImprovementFlawSnapshot,
  SheetImprovementFlawSnapshotEntry,
} from './interfaces/sheet-improvement-flaw-snapshot.interface';
import {
  SheetProficiencySnapshot,
  SheetProficiencySnapshotEntry,
} from './interfaces/sheet-proficiency-snapshot.interface';
import {
  SheetProficiencyAdjustment,
  SheetProficiencyAdjustmentSourceType,
} from './interfaces/sheet-proficiency-adjustment.interface';
import {
  SheetKnowledgeSnapshot,
  SheetKnowledgeSnapshotEntry,
} from './interfaces/sheet-knowledge-snapshot.interface';

const ATTRIBUTE_TYPE_NAME = 'Atributo';
const FREE_IMPROVEMENT_VALUE = 2;
const DEFAULT_ARMOR_CLASS_KEY_ATTRIBUTE_NAME = 'Destreza';
const INITIAL_TRAINING_SLOT_COUNT = 3;
const RACE_TALENT_REQUIREMENT_TAG_NAME = 'Raça';
const STRENGTH_PROPERTY_NAME = 'Força';
const EQUIPPABLE_INVENTORY_CATEGORIES = new Set<SheetInventoryItemCategory>([
  SheetInventoryItemCategory.WEAPON,
  SheetInventoryItemCategory.ARMOR,
  SheetInventoryItemCategory.ACCESSORY,
  SheetInventoryItemCategory.SHIELD,
]);

export interface SheetInventoryListResult {
  counts: Record<SheetInventoryItemCategory, number>;
  items: SheetInventoryItem[];
}

export interface SheetInventoryMutationResult {
  sheet: Sheet;
  inventory: SheetInventoryListResult;
}

interface ProficiencySource {
  type: SheetProficiencyAdjustmentSourceType;
  id: string;
  name: string;
}

type SheetAbilityBucketKey = 'trainings' | 'talents' | 'characteristics';

const OWNER_COLUMN_BY_SOURCE_TYPE: Record<
  SheetProficiencyAdjustmentSourceType,
  | 'ownerRace'
  | 'ownerBiography'
  | 'ownerTraining'
  | 'ownerTalent'
  | 'ownerCharacteristic'
> = {
  race: 'ownerRace',
  biography: 'ownerBiography',
  training: 'ownerTraining',
  talent: 'ownerTalent',
  characteristic: 'ownerCharacteristic',
};

/**
 * `ProficiencySource['type']` é singular ('training'/'talent'/'characteristic'),
 * mas as chaves de `SheetProficiencySnapshot`/`SheetKnowledgeSnapshot` para
 * esses buckets são plurais ('trainings'/'talents'/'characteristics').
 */
const SNAPSHOT_KEY_BY_SOURCE_TYPE: Record<
  SheetProficiencyAdjustmentSourceType,
  'race' | 'biography' | 'trainings' | 'talents' | 'characteristics'
> = {
  race: 'race',
  biography: 'biography',
  training: 'trainings',
  talent: 'talents',
  characteristic: 'characteristics',
};

const BUCKET_OWNER_COLUMN: Record<
  SheetAbilityBucketKey,
  'ownerTraining' | 'ownerTalent' | 'ownerCharacteristic'
> = {
  trainings: 'ownerTraining',
  talents: 'ownerTalent',
  characteristics: 'ownerCharacteristic',
};

function computeUnlockedAtLevel(slotIndex: number): number {
  return slotIndex <= 3 ? 1 : slotIndex - 2;
}

export interface SheetAbilityCard {
  id: string;
  name: string;
  level: number;
  tags: TagResponseDto[];
  requirementsMet: boolean;
  origin: {
    entityType: SheetAbilityOriginEntityType;
    id: string;
    name: string;
  } | null;
}

export interface SheetTrainingSlotCard {
  slotIndex: number;
  unlockedAtLevel: number;
  training: SheetAbilityCard | null;
}

export interface SheetAbilitiesData {
  characteristics: {
    inherited: SheetAbilityCard[];
    extras: SheetAbilityCard[];
  };
  trainings: {
    slots: SheetTrainingSlotCard[];
    inherited: SheetAbilityCard[];
    extras: SheetAbilityCard[];
  };
  talents: { inherited: SheetAbilityCard[]; extras: SheetAbilityCard[] };
}

interface ComputedSheetAbilities extends SheetAbilitiesData {
  presentIdsByBucket: {
    trainings: Set<string>;
    talents: Set<string>;
    characteristics: Set<string>;
  };
  orderedDistinctByBucket: Record<
    SheetAbilityBucketKey,
    { id: string; name: string }[]
  >;
}

export interface SheetAbilityMutationResult {
  sheet: Sheet;
  abilities: SheetAbilitiesData;
}

export interface SheetAbilityCandidateResult {
  id: string;
  name: string;
  level: number;
  tags: TagResponseDto[];
  alreadyPresent: boolean;
  requirementsMet: boolean;
}

export interface PaginatedSheetAbilityCandidates {
  data: SheetAbilityCandidateResult[];
  total: number;
  page: number;
  perPage: number;
}

export interface PaginatedSheets {
  data: Sheet[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class SheetsService {
  constructor(
    @InjectRepository(Sheet)
    private readonly sheetsRepository: Repository<Sheet>,
    @InjectRepository(SheetTrainingSlot)
    private readonly sheetTrainingSlotsRepository: Repository<SheetTrainingSlot>,
    @InjectRepository(SheetAbilityExtra)
    private readonly sheetAbilityExtrasRepository: Repository<SheetAbilityExtra>,
    @InjectRepository(SheetInventoryItem)
    private readonly sheetInventoryItemsRepository: Repository<SheetInventoryItem>,
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    @InjectRepository(Race)
    private readonly racesRepository: Repository<Race>,
    @InjectRepository(RaceTag)
    private readonly raceTagsRepository: Repository<RaceTag>,
    @InjectRepository(Characteristic)
    private readonly characteristicsRepository: Repository<Characteristic>,
    @InjectRepository(CharacteristicTag)
    private readonly characteristicTagsRepository: Repository<CharacteristicTag>,
    @InjectRepository(Training)
    private readonly trainingsRepository: Repository<Training>,
    @InjectRepository(TrainingTag)
    private readonly trainingTagsRepository: Repository<TrainingTag>,
    @InjectRepository(Talent)
    private readonly talentsRepository: Repository<Talent>,
    @InjectRepository(TalentTag)
    private readonly talentTagsRepository: Repository<TalentTag>,
    @InjectRepository(Biography)
    private readonly biographiesRepository: Repository<Biography>,
    @InjectRepository(BiographyTag)
    private readonly biographyTagsRepository: Repository<BiographyTag>,
    @InjectRepository(ImprovementFlaw)
    private readonly improvementFlawsRepository: Repository<ImprovementFlaw>,
    @InjectRepository(ImprovementFlawType)
    private readonly improvementFlawTypesRepository: Repository<ImprovementFlawType>,
    @InjectRepository(ImprovementFlawProperty)
    private readonly improvementFlawPropertiesRepository: Repository<ImprovementFlawProperty>,
    @InjectRepository(Proficiency)
    private readonly proficienciesRepository: Repository<Proficiency>,
    @InjectRepository(ProficiencyProperty)
    private readonly proficiencyPropertiesRepository: Repository<ProficiencyProperty>,
    @InjectRepository(Knowledge)
    private readonly knowledgesRepository: Repository<Knowledge>,
    @InjectRepository(Attribute)
    private readonly attributesRepository: Repository<Attribute>,
    private readonly entityLinksService: EntityLinksService,
    private readonly dataSource: DataSource,
    private readonly utilitiesService: UtilitiesService,
    private readonly consumablesService: ConsumablesService,
    private readonly materialsService: MaterialsService,
    private readonly ammunitionService: AmmunitionService,
    private readonly weaponsService: WeaponsService,
    private readonly armorsService: ArmorsService,
    private readonly accessoriesService: AccessoriesService,
    private readonly shieldsService: ShieldsService,
  ) {}

  private async findCampaignById(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOneBy({ id });
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }
    return campaign;
  }

  private async findAttributeById(id: string): Promise<Attribute> {
    const attribute = await this.attributesRepository.findOneBy({ id });
    if (!attribute) {
      throw new NotFoundException('Atributo chave não encontrado.');
    }
    return attribute;
  }

  private async findDefaultArmorClassKeyAttribute(): Promise<Attribute> {
    const attribute = await this.attributesRepository.findOneBy({
      name: DEFAULT_ARMOR_CLASS_KEY_ATTRIBUTE_NAME,
    });
    if (!attribute) {
      throw new NotFoundException('Atributo chave não encontrado.');
    }
    return attribute;
  }

  private async attachRaceOrderedTags(race: Race): Promise<void> {
    race.tags = await loadOrderedTagsForOwner(
      this.raceTagsRepository,
      race.id,
      'race',
    );

    const characteristicTagsById = await loadOrderedTagsMap(
      this.characteristicTagsRepository,
      race.characteristics.map((characteristic) => characteristic.id),
      'characteristic',
    );
    for (const characteristic of race.characteristics) {
      characteristic.tags = characteristicTagsById.get(characteristic.id) ?? [];
    }

    const talentTagsById = await loadOrderedTagsMap(
      this.talentTagsRepository,
      race.talents.map((talent) => talent.id),
      'talent',
    );
    for (const talent of race.talents) {
      talent.tags = talentTagsById.get(talent.id) ?? [];
    }
  }

  private async attachBiographyAdditionalAbilities(
    biography: Biography,
  ): Promise<void> {
    const { additionalAbilities } =
      await this.entityLinksService.loadReferencesFor(
        ReferenceableEntityType.BIOGRAPHY,
        biography.id,
      );
    biography.additionalAbilities = additionalAbilities;
  }

  private async findRaceById(id: string): Promise<Race> {
    const race = await this.racesRepository.findOne({
      where: { id },
      relations: {
        category: true,
        characteristics: true,
        talents: true,
      },
    });
    if (!race) {
      throw new NotFoundException('Raça não encontrada.');
    }
    await this.attachRaceOrderedTags(race);
    return race;
  }

  private async findCharacteristicWithTagsById(
    id: string,
  ): Promise<Characteristic> {
    const characteristic = await this.characteristicsRepository.findOneBy({
      id,
    });
    if (!characteristic) {
      throw new NotFoundException('Característica não encontrada.');
    }
    characteristic.tags = await loadOrderedTagsForOwner(
      this.characteristicTagsRepository,
      id,
      'characteristic',
    );
    return characteristic;
  }

  private async findTrainingWithTagsById(id: string): Promise<Training> {
    const training = await this.trainingsRepository.findOneBy({ id });
    if (!training) {
      throw new NotFoundException('Treinamento não encontrado.');
    }
    training.tags = await loadOrderedTagsForOwner(
      this.trainingTagsRepository,
      id,
      'training',
    );
    return training;
  }

  private async findTalentWithTagsById(id: string): Promise<Talent> {
    const talent = await this.talentsRepository.findOneBy({ id });
    if (!talent) {
      throw new NotFoundException('Talento não encontrado.');
    }
    talent.tags = await loadOrderedTagsForOwner(
      this.talentTagsRepository,
      id,
      'talent',
    );
    return talent;
  }

  private isRestrictedToOwnSheets(currentUser: User): boolean {
    return currentUser.provider === AuthProvider.GOOGLE;
  }

  /**
   * Recalcula `proficiencias`/`proficienciasAjustadas` do zero a partir dos dados
   * brutos atuais de `proficiencies` para as origens vinculadas informadas em
   * `orderedSources`. Nunca reaproveita escolhas de substituta feitas
   * anteriormente — mesmo ajustes vindos da origem que não mudou nesta operação
   * são recalculados integralmente, conforme decisão explícita do spec ("toda
   * troca de entidade recalcula conflitos e ajustes integralmente, do zero").
   *
   * A ordem de `orderedSources` é significativa: a origem que não é o alvo da
   * operação em curso deve vir primeiro (estado inicial), e a origem que acabou
   * de ser (re)vinculada deve vir por último, mesclando seus itens sobre o
   * estado já construído. Isso implementa literalmente a regra de que o
   * resultado pode variar conforme a ordem de vínculo das entidades.
   */
  private async recomputeProficiencies(
    sheet: Sheet,
    orderedSources: ProficiencySource[],
  ): Promise<void> {
    const activeByPropertyId = new Map<
      string,
      {
        gradationLevel: number;
        sourceType: ProficiencySource['type'];
        entry: SheetProficiencySnapshotEntry;
      }
    >();
    const adjustments: SheetProficiencyAdjustment[] = [];

    for (const source of orderedSources) {
      const ownerColumn = OWNER_COLUMN_BY_SOURCE_TYPE[source.type];
      const whereCriteria: Record<string, unknown> = {
        [ownerColumn]: { id: source.id },
      };
      const items = await this.proficienciesRepository.find({
        where: whereCriteria as FindOptionsWhere<Proficiency>,
        relations: { property: true, gradation: true },
        order: { sortOrder: 'ASC' },
      });

      for (const item of items) {
        const existing = activeByPropertyId.get(item.property.id);

        if (!existing || item.gradation.level > existing.gradationLevel) {
          activeByPropertyId.set(item.property.id, {
            gradationLevel: item.gradation.level,
            sourceType: source.type,
            entry: {
              id: item.id,
              property: { id: item.property.id, name: item.property.name },
              gradation: {
                id: item.gradation.id,
                name: item.gradation.name,
                level: item.gradation.level,
              },
              sourceName: source.name,
            },
          });
          continue;
        }

        adjustments.push({
          id: randomUUID(),
          sourceType: source.type,
          sourceName: source.name,
          originalProperty: { id: item.property.id, name: item.property.name },
          originalGradation: {
            id: item.gradation.id,
            name: item.gradation.name,
            level: item.gradation.level,
          },
          adjustedPropertyId: null,
          adjustedProperty: null,
        });
      }
    }

    const proficiencias: SheetProficiencySnapshot = {
      race: [],
      biography: [],
      trainings: [],
      talents: [],
      characteristics: [],
    };
    for (const { sourceType, entry } of activeByPropertyId.values()) {
      proficiencias[SNAPSHOT_KEY_BY_SOURCE_TYPE[sourceType]].push(entry);
    }

    sheet.proficiencias = proficiencias;
    sheet.proficienciasAjustadas = adjustments;
  }

  /**
   * Espelha `recomputeProficiencies`, mas para Saber: a graduação maior
   * prevalece e a menor é descartada integralmente, sem qualquer lista de
   * ajustes (não existe mecanismo de "Saber Ajustado").
   */
  private async recomputeKnowledges(
    sheet: Sheet,
    orderedSources: ProficiencySource[],
  ): Promise<void> {
    const activeByNormalizedTitle = new Map<
      string,
      {
        gradationLevel: number;
        sourceType: ProficiencySource['type'];
        entry: SheetKnowledgeSnapshotEntry;
      }
    >();

    for (const source of orderedSources) {
      const ownerColumn = OWNER_COLUMN_BY_SOURCE_TYPE[source.type];
      const whereCriteria: Record<string, unknown> = {
        [ownerColumn]: { id: source.id },
      };
      const items = await this.knowledgesRepository.find({
        where: whereCriteria as FindOptionsWhere<Knowledge>,
        relations: { gradation: true },
        order: { sortOrder: 'ASC' },
      });

      for (const item of items) {
        const normalizedTitle = item.title.trim().toLowerCase();
        const existing = activeByNormalizedTitle.get(normalizedTitle);

        if (!existing || item.gradation.level > existing.gradationLevel) {
          activeByNormalizedTitle.set(normalizedTitle, {
            gradationLevel: item.gradation.level,
            sourceType: source.type,
            entry: {
              id: item.id,
              title: item.title,
              gradation: {
                id: item.gradation.id,
                name: item.gradation.name,
                level: item.gradation.level,
              },
              sourceName: source.name,
              editable: item.editable,
            },
          });
        }
      }
    }

    const saberes: SheetKnowledgeSnapshot = {
      race: [],
      biography: [],
      trainings: [],
      talents: [],
      characteristics: [],
    };
    for (const { sourceType, entry } of activeByNormalizedTitle.values()) {
      saberes[SNAPSHOT_KEY_BY_SOURCE_TYPE[sourceType]].push(entry);
    }

    sheet.saberes = saberes;

    const activeKnowledgeIds = new Set(
      [
        ...saberes.race,
        ...saberes.biography,
        ...saberes.trainings,
        ...saberes.talents,
        ...saberes.characteristics,
      ].map((entry) => entry.id),
    );
    sheet.saberesAnotacoes = Object.fromEntries(
      Object.entries(sheet.saberesAnotacoes).filter(([knowledgeId]) =>
        activeKnowledgeIds.has(knowledgeId),
      ),
    );
  }

  private async loadSlotsWithTags(
    sheetId: string,
  ): Promise<SheetTrainingSlot[]> {
    const slots = await this.sheetTrainingSlotsRepository.find({
      where: { sheet: { id: sheetId } },
      relations: { training: true },
      order: { slotIndex: 'ASC' },
    });

    const trainingIds = slots
      .map((slot) => slot.training?.id)
      .filter((trainingId): trainingId is string => trainingId !== undefined);
    const tagsByTrainingId = await loadOrderedTagsMap(
      this.trainingTagsRepository,
      trainingIds,
      'training',
    );
    for (const slot of slots) {
      if (slot.training) {
        slot.training.tags = tagsByTrainingId.get(slot.training.id) ?? [];
      }
    }

    return slots;
  }

  private async loadExtrasWithTags(
    sheetId: string,
  ): Promise<SheetAbilityExtra[]> {
    const extras = await this.sheetAbilityExtrasRepository.find({
      where: { sheet: { id: sheetId } },
      relations: { training: true, talent: true, characteristic: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    const trainingIds = extras
      .map((extra) => extra.training?.id)
      .filter((extraId): extraId is string => extraId !== undefined);
    const talentIds = extras
      .map((extra) => extra.talent?.id)
      .filter((extraId): extraId is string => extraId !== undefined);
    const characteristicIds = extras
      .map((extra) => extra.characteristic?.id)
      .filter((extraId): extraId is string => extraId !== undefined);

    const trainingTagsById = await loadOrderedTagsMap(
      this.trainingTagsRepository,
      trainingIds,
      'training',
    );
    const talentTagsById = await loadOrderedTagsMap(
      this.talentTagsRepository,
      talentIds,
      'talent',
    );
    const characteristicTagsById = await loadOrderedTagsMap(
      this.characteristicTagsRepository,
      characteristicIds,
      'characteristic',
    );

    for (const extra of extras) {
      if (extra.training) {
        extra.training.tags = trainingTagsById.get(extra.training.id) ?? [];
      }
      if (extra.talent) {
        extra.talent.tags = talentTagsById.get(extra.talent.id) ?? [];
      }
      if (extra.characteristic) {
        extra.characteristic.tags =
          characteristicTagsById.get(extra.characteristic.id) ?? [];
      }
    }

    return extras;
  }

  /**
   * Regra de requisito adicional, específica de Talento: um Talento com uma
   * tag cujo nome (normalizado) seja "Raça" só é considerado com requisito
   * atendido se pertencer aos talentos da Raça atualmente vinculada à ficha.
   * Não se aplica a Característica/Treinamento (sempre `true`). Ficha sem
   * Raça vinculada produz conjunto vazio, portanto sempre `false` para
   * Talentos com essa tag.
   */
  private evaluateRaceTalentTagRule(
    item: {
      id: string;
      entityType: ReferenceableEntityType;
      tags: { name: string }[];
    },
    sheet: Sheet,
  ): boolean {
    if (item.entityType !== ReferenceableEntityType.TALENT) {
      return true;
    }
    const normalizedTagName = (name: string) => name.trim().toLowerCase();
    const hasRaceTag = item.tags.some(
      (tag) =>
        normalizedTagName(tag.name) ===
        normalizedTagName(RACE_TALENT_REQUIREMENT_TAG_NAME),
    );
    if (!hasRaceTag) {
      return true;
    }
    const raceTalentIds = new Set(
      (sheet.race?.talents ?? []).map((talent) => talent.id),
    );
    return raceTalentIds.has(item.id);
  }

  /**
   * Avalia se `sheet` atende aos requisitos de `item` (nível + `requirements`
   * + regra de tag "Raça" para Talentos, semântica E): Característica/
   * Treinamento/Talento são considerados atendidos se presentes na ficha por
   * qualquer via (herdado, slot ou extra — `presentIdsByBucket`); Biografia é
   * considerada atendida se for a biografia atualmente vinculada; Técnica/
   * Magia são sempre não atendidos (a ficha não possui mecanismo para
   * "tê-las" nesta demanda).
   */
  private evaluateAbilityRequirements(
    item: {
      id: string;
      entityType: ReferenceableEntityType;
      level: number;
      tags: { name: string }[];
      requirements: EntityReferenceResponseDto[];
    },
    sheet: Sheet,
    presentIdsByBucket: {
      trainings: Set<string>;
      talents: Set<string>;
      characteristics: Set<string>;
    },
  ): boolean {
    const levelMet = sheet.level >= item.level;
    const requirementsMet = item.requirements.every((requirement) => {
      switch (requirement.entityType) {
        case ReferenceableEntityType.CHARACTERISTIC:
          return presentIdsByBucket.characteristics.has(requirement.id);
        case ReferenceableEntityType.TRAINING:
          return presentIdsByBucket.trainings.has(requirement.id);
        case ReferenceableEntityType.TALENT:
          return presentIdsByBucket.talents.has(requirement.id);
        case ReferenceableEntityType.BIOGRAPHY:
          return sheet.biography?.id === requirement.id;
        case ReferenceableEntityType.TECHNIQUE:
        case ReferenceableEntityType.SPELL:
        default:
          return false;
      }
    });
    const raceTagRuleMet = this.evaluateRaceTalentTagRule(item, sheet);
    return levelMet && requirementsMet && raceTagRuleMet;
  }

  /**
   * Computa a listagem consolidada de habilidades da ficha (herdadas de
   * Raça/Biografia/itens vinculados, slots de Treinamento e extras), com
   * `requirementsMet` já resolvido por card, além de estruturas auxiliares
   * (`presentIdsByBucket`, `orderedDistinctByBucket`) usadas para validação de
   * escrita e para recálculo de melhorias/defeitos/proficiências/saberes.
   */
  private async computeSheetAbilities(
    sheet: Sheet,
    slots: SheetTrainingSlot[],
    extras: SheetAbilityExtra[],
  ): Promise<ComputedSheetAbilities> {
    const sortByName = <T extends { name: string }>(a: T, b: T): number =>
      a.name.localeCompare(b.name, 'pt-BR');

    const orderedSlots = [...slots].sort((a, b) => a.slotIndex - b.slotIndex);
    const filledSlots = orderedSlots.filter(
      (slot): slot is SheetTrainingSlot & { training: Training } =>
        slot.training !== null,
    );

    const sortByCreatedAt = (a: SheetAbilityExtra, b: SheetAbilityExtra) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime();
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    };
    const trainingExtras = extras
      .filter((extra) => extra.entityType === SheetAbilityBucketType.TRAINING)
      .sort(sortByCreatedAt);
    const talentExtras = extras
      .filter((extra) => extra.entityType === SheetAbilityBucketType.TALENT)
      .sort(sortByCreatedAt);
    const characteristicExtras = extras
      .filter(
        (extra) => extra.entityType === SheetAbilityBucketType.CHARACTERISTIC,
      )
      .sort(sortByCreatedAt);

    // 1. Origens que contribuem `additionalAbilities` via entity_links (Raça é
    //    tratada à parte: contribui direto via race.characteristics/talents).
    const linkOwners: { entityType: ReferenceableEntityType; id: string }[] =
      [];
    if (sheet.biography) {
      linkOwners.push({
        entityType: ReferenceableEntityType.BIOGRAPHY,
        id: sheet.biography.id,
      });
    }
    for (const slot of filledSlots) {
      linkOwners.push({
        entityType: ReferenceableEntityType.TRAINING,
        id: slot.training.id,
      });
    }
    for (const extra of trainingExtras) {
      linkOwners.push({
        entityType: ReferenceableEntityType.TRAINING,
        id: extra.training!.id,
      });
    }
    for (const extra of talentExtras) {
      linkOwners.push({
        entityType: ReferenceableEntityType.TALENT,
        id: extra.talent!.id,
      });
    }
    for (const extra of characteristicExtras) {
      linkOwners.push({
        entityType: ReferenceableEntityType.CHARACTERISTIC,
        id: extra.characteristic!.id,
      });
    }

    const additionalAbilitiesByOwnerKey =
      await this.entityLinksService.loadLinksForOwnersBatched(linkOwners, [
        EntityLinkType.ADDITIONAL_ABILITY,
      ]);

    type OriginRef = {
      entityType: SheetAbilityOriginEntityType;
      id: string;
      name: string;
    };
    type OriginEntry = {
      origin: OriginRef;
      abilities: EntityReferenceResponseDto[];
    };

    const originEntries: OriginEntry[] = [];
    if (sheet.biography) {
      const key = `${EntityLinkType.ADDITIONAL_ABILITY}:${ReferenceableEntityType.BIOGRAPHY}:${sheet.biography.id}`;
      originEntries.push({
        origin: {
          entityType: ReferenceableEntityType.BIOGRAPHY,
          id: sheet.biography.id,
          name: sheet.biography.name,
        },
        abilities: additionalAbilitiesByOwnerKey.get(key) ?? [],
      });
    }
    for (const slot of filledSlots) {
      const key = `${EntityLinkType.ADDITIONAL_ABILITY}:${ReferenceableEntityType.TRAINING}:${slot.training.id}`;
      originEntries.push({
        origin: {
          entityType: ReferenceableEntityType.TRAINING,
          id: slot.training.id,
          name: slot.training.name,
        },
        abilities: additionalAbilitiesByOwnerKey.get(key) ?? [],
      });
    }
    for (const extra of trainingExtras) {
      const training = extra.training!;
      const key = `${EntityLinkType.ADDITIONAL_ABILITY}:${ReferenceableEntityType.TRAINING}:${training.id}`;
      originEntries.push({
        origin: {
          entityType: ReferenceableEntityType.TRAINING,
          id: training.id,
          name: training.name,
        },
        abilities: additionalAbilitiesByOwnerKey.get(key) ?? [],
      });
    }
    for (const extra of talentExtras) {
      const talent = extra.talent!;
      const key = `${EntityLinkType.ADDITIONAL_ABILITY}:${ReferenceableEntityType.TALENT}:${talent.id}`;
      originEntries.push({
        origin: {
          entityType: ReferenceableEntityType.TALENT,
          id: talent.id,
          name: talent.name,
        },
        abilities: additionalAbilitiesByOwnerKey.get(key) ?? [],
      });
    }
    for (const extra of characteristicExtras) {
      const characteristic = extra.characteristic!;
      const key = `${EntityLinkType.ADDITIONAL_ABILITY}:${ReferenceableEntityType.CHARACTERISTIC}:${characteristic.id}`;
      originEntries.push({
        origin: {
          entityType: ReferenceableEntityType.CHARACTERISTIC,
          id: characteristic.id,
          name: characteristic.name,
        },
        abilities: additionalAbilitiesByOwnerKey.get(key) ?? [],
      });
    }

    // 2. Listas "herdadas" por bucket (com duplicata por origem quando o mesmo
    //    item é herdado de origens diferentes), na ordem Raça → Biografia →
    //    Treinamentos vinculados (slot → extras) → Talentos vinculados
    //    (extras) → Características vinculadas (extras); alfabética dentro de
    //    cada origem.
    type RawEntry = {
      item: { id: string; name: string; level: number; tags: TagResponseDto[] };
      origin: OriginRef;
    };

    const characteristicsInherited: RawEntry[] = [];
    const trainingsInherited: RawEntry[] = [];
    const talentsInherited: RawEntry[] = [];

    if (sheet.race) {
      const raceOrigin: OriginRef = {
        entityType: 'race',
        id: sheet.race.id,
        name: sheet.race.name,
      };
      for (const characteristic of [...sheet.race.characteristics].sort(
        sortByName,
      )) {
        characteristicsInherited.push({
          item: {
            id: characteristic.id,
            name: characteristic.name,
            level: characteristic.level,
            tags: (characteristic.tags ?? []).map((tag) =>
              TagResponseDto.fromEntity(tag),
            ),
          },
          origin: raceOrigin,
        });
      }
      for (const talent of [...sheet.race.talents].sort(sortByName)) {
        talentsInherited.push({
          item: {
            id: talent.id,
            name: talent.name,
            level: talent.level,
            tags: (talent.tags ?? []).map((tag) =>
              TagResponseDto.fromEntity(tag),
            ),
          },
          origin: raceOrigin,
        });
      }
    }

    for (const originEntry of originEntries) {
      const sortedAbilities = [...originEntry.abilities].sort(sortByName);
      for (const ability of sortedAbilities) {
        const entry: RawEntry = {
          item: {
            id: ability.id,
            name: ability.name,
            level: ability.level ?? 1,
            tags: ability.tags,
          },
          origin: originEntry.origin,
        };
        if (ability.entityType === ReferenceableEntityType.CHARACTERISTIC) {
          characteristicsInherited.push(entry);
        } else if (ability.entityType === ReferenceableEntityType.TRAINING) {
          trainingsInherited.push(entry);
        } else if (ability.entityType === ReferenceableEntityType.TALENT) {
          talentsInherited.push(entry);
        }
        // Técnica/Magia/Biografia não têm onde aparecer na ficha — ignorados.
      }
    }

    // 3. Extras por bucket (sem origin).
    const toRawItem = (entity: {
      id: string;
      name: string;
      level: number;
      tags: Tag[];
    }) => ({
      id: entity.id,
      name: entity.name,
      level: entity.level,
      tags: (entity.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag)),
    });

    const characteristicExtraItems = characteristicExtras.map((extra) =>
      toRawItem(extra.characteristic!),
    );
    const trainingExtraItems = trainingExtras.map((extra) =>
      toRawItem(extra.training!),
    );
    const talentExtraItems = talentExtras.map((extra) =>
      toRawItem(extra.talent!),
    );

    // 4. Presença atual por bucket (herdados + slot preenchido + extras).
    const presentIdsByBucket = {
      trainings: new Set<string>(),
      talents: new Set<string>(),
      characteristics: new Set<string>(),
    };
    for (const entry of characteristicsInherited) {
      presentIdsByBucket.characteristics.add(entry.item.id);
    }
    for (const entry of trainingsInherited) {
      presentIdsByBucket.trainings.add(entry.item.id);
    }
    for (const entry of talentsInherited) {
      presentIdsByBucket.talents.add(entry.item.id);
    }
    for (const item of characteristicExtraItems) {
      presentIdsByBucket.characteristics.add(item.id);
    }
    for (const item of trainingExtraItems) {
      presentIdsByBucket.trainings.add(item.id);
    }
    for (const item of talentExtraItems) {
      presentIdsByBucket.talents.add(item.id);
    }
    for (const slot of filledSlots) {
      presentIdsByBucket.trainings.add(slot.training.id);
    }

    // 5. Requisitos próprios de cada item exibido (batched, uma query por
    //    combinação (linkType, coluna de dono) dentro de EntityLinksService).
    const requirementOwners: {
      entityType: ReferenceableEntityType;
      id: string;
    }[] = [];
    const seenRequirementOwnerKeys = new Set<string>();
    const addRequirementOwner = (
      entityType: ReferenceableEntityType,
      id: string,
    ) => {
      const key = `${entityType}:${id}`;
      if (!seenRequirementOwnerKeys.has(key)) {
        seenRequirementOwnerKeys.add(key);
        requirementOwners.push({ entityType, id });
      }
    };
    for (const entry of characteristicsInherited) {
      addRequirementOwner(
        ReferenceableEntityType.CHARACTERISTIC,
        entry.item.id,
      );
    }
    for (const entry of trainingsInherited) {
      addRequirementOwner(ReferenceableEntityType.TRAINING, entry.item.id);
    }
    for (const entry of talentsInherited) {
      addRequirementOwner(ReferenceableEntityType.TALENT, entry.item.id);
    }
    for (const item of characteristicExtraItems) {
      addRequirementOwner(ReferenceableEntityType.CHARACTERISTIC, item.id);
    }
    for (const item of trainingExtraItems) {
      addRequirementOwner(ReferenceableEntityType.TRAINING, item.id);
    }
    for (const item of talentExtraItems) {
      addRequirementOwner(ReferenceableEntityType.TALENT, item.id);
    }
    for (const slot of filledSlots) {
      addRequirementOwner(ReferenceableEntityType.TRAINING, slot.training.id);
    }

    const requirementsByOwnerKey =
      await this.entityLinksService.loadLinksForOwnersBatched(
        requirementOwners,
        [EntityLinkType.REQUIREMENT],
      );
    const requirementsFor = (
      entityType: ReferenceableEntityType,
      id: string,
    ): EntityReferenceResponseDto[] =>
      requirementsByOwnerKey.get(
        `${EntityLinkType.REQUIREMENT}:${entityType}:${id}`,
      ) ?? [];

    // 6. Monta os cards finais.
    const toCard = (
      entry: RawEntry,
      entityType: ReferenceableEntityType,
    ): SheetAbilityCard => ({
      id: entry.item.id,
      name: entry.item.name,
      level: entry.item.level,
      tags: entry.item.tags,
      requirementsMet: this.evaluateAbilityRequirements(
        {
          id: entry.item.id,
          entityType,
          level: entry.item.level,
          tags: entry.item.tags,
          requirements: requirementsFor(entityType, entry.item.id),
        },
        sheet,
        presentIdsByBucket,
      ),
      origin: entry.origin,
    });

    const toExtraCard = (
      item: { id: string; name: string; level: number; tags: TagResponseDto[] },
      entityType: ReferenceableEntityType,
    ): SheetAbilityCard => ({
      id: item.id,
      name: item.name,
      level: item.level,
      tags: item.tags,
      requirementsMet: this.evaluateAbilityRequirements(
        {
          id: item.id,
          entityType,
          level: item.level,
          tags: item.tags,
          requirements: requirementsFor(entityType, item.id),
        },
        sheet,
        presentIdsByBucket,
      ),
      origin: null,
    });

    const characteristicsInheritedCards = characteristicsInherited.map(
      (entry) => toCard(entry, ReferenceableEntityType.CHARACTERISTIC),
    );
    const trainingsInheritedCards = trainingsInherited.map((entry) =>
      toCard(entry, ReferenceableEntityType.TRAINING),
    );
    const talentsInheritedCards = talentsInherited.map((entry) =>
      toCard(entry, ReferenceableEntityType.TALENT),
    );

    const characteristicsExtraCards = characteristicExtraItems.map((item) =>
      toExtraCard(item, ReferenceableEntityType.CHARACTERISTIC),
    );
    const trainingsExtraCards = trainingExtraItems.map((item) =>
      toExtraCard(item, ReferenceableEntityType.TRAINING),
    );
    const talentsExtraCards = talentExtraItems.map((item) =>
      toExtraCard(item, ReferenceableEntityType.TALENT),
    );

    const slotCards: SheetTrainingSlotCard[] = orderedSlots.map((slot) => ({
      slotIndex: slot.slotIndex,
      unlockedAtLevel: computeUnlockedAtLevel(slot.slotIndex),
      training: slot.training
        ? toExtraCard(
            toRawItem(slot.training),
            ReferenceableEntityType.TRAINING,
          )
        : null,
    }));

    // 7. Listas deduplicadas por id (mantendo a primeira ocorrência) usadas
    //    para recálculo de melhorias/defeitos/proficiências/saberes — cada
    //    item distinto contribui uma única vez, mesmo herdado de duas origens.
    const dedupById = (entries: RawEntry[]): { id: string; name: string }[] => {
      const seen = new Set<string>();
      const result: { id: string; name: string }[] = [];
      for (const entry of entries) {
        if (!seen.has(entry.item.id)) {
          seen.add(entry.item.id);
          result.push({ id: entry.item.id, name: entry.item.name });
        }
      }
      return result;
    };

    // Dedup final por id sobre a lista já concatenada (herdados → slot → extras) de
    // cada bucket: um item já presente como slot/extra pode passar a ser também
    // herdado (troca de Raça/Biografia, ou novo extra cujo additionalAbilities o
    // referencia) — sem este passo, ele seria contado duas vezes ao alimentar
    // rebuildBucketImprovementFlaws/recomputeProficiencies/recomputeKnowledges.
    // Mantém a primeira ocorrência, preservando a ordem de precedência herdados →
    // slot → extras já definida acima.
    const dedupFinal = (
      entries: { id: string; name: string }[],
    ): { id: string; name: string }[] => {
      const seen = new Set<string>();
      const result: { id: string; name: string }[] = [];
      for (const entry of entries) {
        if (!seen.has(entry.id)) {
          seen.add(entry.id);
          result.push(entry);
        }
      }
      return result;
    };

    const orderedDistinctByBucket: Record<
      SheetAbilityBucketKey,
      { id: string; name: string }[]
    > = {
      trainings: dedupFinal([
        ...dedupById(trainingsInherited),
        ...filledSlots.map((slot) => ({
          id: slot.training.id,
          name: slot.training.name,
        })),
        ...trainingExtraItems.map((item) => ({ id: item.id, name: item.name })),
      ]),
      talents: dedupFinal([
        ...dedupById(talentsInherited),
        ...talentExtraItems.map((item) => ({ id: item.id, name: item.name })),
      ]),
      characteristics: dedupFinal([
        ...dedupById(characteristicsInherited),
        ...characteristicExtraItems.map((item) => ({
          id: item.id,
          name: item.name,
        })),
      ]),
    };

    return {
      characteristics: {
        inherited: characteristicsInheritedCards,
        extras: characteristicsExtraCards,
      },
      trainings: {
        slots: slotCards,
        inherited: trainingsInheritedCards,
        extras: trainingsExtraCards,
      },
      talents: {
        inherited: talentsInheritedCards,
        extras: talentsExtraCards,
      },
      presentIdsByBucket,
      orderedDistinctByBucket,
    };
  }

  private async rebuildBucketImprovementFlaws(
    bucket: SheetAbilityBucketKey,
    sources: { id: string; name: string }[],
  ): Promise<{
    improvements: SheetImprovementFlawSnapshotEntry[];
    flaws: SheetImprovementFlawSnapshotEntry[];
  }> {
    const ownerColumn = BUCKET_OWNER_COLUMN[bucket];
    const improvements: SheetImprovementFlawSnapshotEntry[] = [];
    const flaws: SheetImprovementFlawSnapshotEntry[] = [];

    for (const source of sources) {
      const whereCriteria: Record<string, unknown> = {
        [ownerColumn]: { id: source.id },
      };
      const items = await this.improvementFlawsRepository.find({
        where: whereCriteria as FindOptionsWhere<ImprovementFlaw>,
        relations: { type: true, property: { types: true } },
        order: { sortOrder: 'ASC' },
      });

      const toEntry = (
        item: ImprovementFlaw,
      ): SheetImprovementFlawSnapshotEntry => ({
        id: item.id,
        value: item.value,
        type: { id: item.type.id, name: item.type.name },
        property: { id: item.property.id, name: item.property.name },
        sourceName: source.name,
      });

      improvements.push(
        ...items
          .filter(
            (item) => item.category === ImprovementFlawCategory.IMPROVEMENT,
          )
          .map(toEntry),
      );
      flaws.push(
        ...items
          .filter((item) => item.category === ImprovementFlawCategory.FLAW)
          .map(toEntry),
      );
    }

    return { improvements, flaws };
  }

  private buildOrderedAbilitySources(
    sheet: Sheet,
    computed: ComputedSheetAbilities,
  ): ProficiencySource[] {
    const sources: ProficiencySource[] = [];
    if (sheet.race) {
      sources.push({ type: 'race', id: sheet.race.id, name: sheet.race.name });
    }
    if (sheet.biography) {
      sources.push({
        type: 'biography',
        id: sheet.biography.id,
        name: sheet.biography.name,
      });
    }
    for (const item of computed.orderedDistinctByBucket.trainings) {
      sources.push({ type: 'training', id: item.id, name: item.name });
    }
    for (const item of computed.orderedDistinctByBucket.talents) {
      sources.push({ type: 'talent', id: item.id, name: item.name });
    }
    for (const item of computed.orderedDistinctByBucket.characteristics) {
      sources.push({ type: 'characteristic', id: item.id, name: item.name });
    }
    return sources;
  }

  /**
   * Efeito em cascata: recomputa herança, melhorias/defeitos dos buckets
   * trainings/talents/characteristics, e proficiências/saberes completos
   * (Raça + Biografia + 3 buckets). `melhorias.race`/`defeitos.race`/
   * `melhorias.biography`/`defeitos.biography` não são tocados aqui — seguem
   * geridos por `linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography`.
   * Não salva a ficha — apenas mutação em memória; o chamador é responsável
   * por persistir via `sheetsRepository.save`.
   */
  private async recomputeSheetAbilitySnapshots(
    sheet: Sheet,
  ): Promise<SheetAbilitiesData> {
    const slots = await this.loadSlotsWithTags(sheet.id);
    const extras = await this.loadExtrasWithTags(sheet.id);
    const computed = await this.computeSheetAbilities(sheet, slots, extras);

    const trainingsResult = await this.rebuildBucketImprovementFlaws(
      'trainings',
      computed.orderedDistinctByBucket.trainings,
    );
    const talentsResult = await this.rebuildBucketImprovementFlaws(
      'talents',
      computed.orderedDistinctByBucket.talents,
    );
    const characteristicsResult = await this.rebuildBucketImprovementFlaws(
      'characteristics',
      computed.orderedDistinctByBucket.characteristics,
    );

    sheet.melhorias = {
      ...sheet.melhorias,
      trainings: trainingsResult.improvements,
      talents: talentsResult.improvements,
      characteristics: characteristicsResult.improvements,
    };
    sheet.defeitos = {
      ...sheet.defeitos,
      trainings: trainingsResult.flaws,
      talents: talentsResult.flaws,
      characteristics: characteristicsResult.flaws,
    };

    const orderedSources = this.buildOrderedAbilitySources(sheet, computed);
    await this.recomputeProficiencies(sheet, orderedSources);
    await this.recomputeKnowledges(sheet, orderedSources);

    return {
      characteristics: computed.characteristics,
      trainings: computed.trainings,
      talents: computed.talents,
    };
  }

  /**
   * Cria/remove linhas de `SheetTrainingSlot` para refletir
   * `3 + (newLevel - 1)` slots. Reduções removem as linhas com maior
   * `slotIndex` em excesso (desvinculando o Treinamento, se preenchido) numa
   * única passada, cobrindo reduções de múltiplos levels de uma vez.
   */
  private async syncTrainingSlotsForLevel(
    sheet: Sheet,
    newLevel: number,
  ): Promise<void> {
    const newSlotCount = INITIAL_TRAINING_SLOT_COUNT + (newLevel - 1);
    const existingSlots = await this.sheetTrainingSlotsRepository.find({
      where: { sheet: { id: sheet.id } },
      order: { slotIndex: 'ASC' },
    });

    if (newSlotCount > existingSlots.length) {
      const newSlots: SheetTrainingSlot[] = [];
      for (
        let slotIndex = existingSlots.length + 1;
        slotIndex <= newSlotCount;
        slotIndex++
      ) {
        newSlots.push(
          this.sheetTrainingSlotsRepository.create({
            sheet,
            slotIndex,
            training: null,
          }),
        );
      }
      await this.sheetTrainingSlotsRepository.save(newSlots);
    } else if (newSlotCount < existingSlots.length) {
      const slotsToRemove = existingSlots.filter(
        (slot) => slot.slotIndex > newSlotCount,
      );
      if (slotsToRemove.length > 0) {
        await this.sheetTrainingSlotsRepository.remove(slotsToRemove);
      }
    }

    await this.recomputeSheetAbilitySnapshots(sheet);
  }

  async create(dto: CreateSheetDto, currentUser: User): Promise<Sheet> {
    const campaign = dto.campaignId
      ? await this.findCampaignById(dto.campaignId)
      : null;
    const armorClassKeyAttribute =
      await this.findDefaultArmorClassKeyAttribute();

    const sheet = this.sheetsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      level: 1,
      campaign,
      race: null,
      armorClassKeyAttribute,
      createdBy: currentUser,
    });

    const savedSheet = await this.sheetsRepository.save(sheet);

    const initialSlots = Array.from(
      { length: INITIAL_TRAINING_SLOT_COUNT },
      (_, index) =>
        this.sheetTrainingSlotsRepository.create({
          sheet: savedSheet,
          slotIndex: index + 1,
          training: null,
        }),
    );
    await this.sheetTrainingSlotsRepository.save(initialSlots);

    return savedSheet;
  }

  async findAllPaginated(
    query: FindSheetsQueryDto,
    currentUser: User,
  ): Promise<PaginatedSheets> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.sheetsRepository
      .createQueryBuilder('sheet')
      .andWhere('sheet.createdBy = :userId', { userId: currentUser.id });

    if (query.name) {
      queryBuilder.andWhere('sheet.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.campaignId) {
      queryBuilder.andWhere('sheet.campaign = :campaignId', {
        campaignId: query.campaignId,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['sheet.id', 'sheet.name'])
      .orderBy('sheet.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const sheets = await this.sheetsRepository.find({
      where: { id: In(ids.map((sheet) => sheet.id)) },
      relations: { campaign: true },
      order: { name: 'ASC' },
    });

    const sheetsById = new Map(sheets.map((sheet) => [sheet.id, sheet]));
    const data = ids
      .map((sheet) => sheetsById.get(sheet.id))
      .filter((sheet): sheet is Sheet => sheet !== undefined);

    return { data, total, page, perPage };
  }

  async findAccessibleById(
    id: string,
    currentUser: User,
  ): Promise<Sheet | null> {
    const sheet = await this.sheetsRepository.findOne({
      where: { id },
      relations: {
        campaign: true,
        race: {
          category: true,
          characteristics: true,
          talents: true,
        },
        biography: true,
        armorClassKeyAttribute: true,
        createdBy: true,
      },
    });
    if (!sheet) {
      return null;
    }
    if (
      this.isRestrictedToOwnSheets(currentUser) &&
      sheet.createdBy.id !== currentUser.id
    ) {
      return null;
    }
    if (sheet.race) {
      await this.attachRaceOrderedTags(sheet.race);
    }
    if (sheet.biography) {
      sheet.biography.tags = await loadOrderedTagsForOwner(
        this.biographyTagsRepository,
        sheet.biography.id,
        'biography',
      );
      await this.attachBiographyAdditionalAbilities(sheet.biography);
    }
    return sheet;
  }

  async update(
    id: string,
    dto: UpdateSheetDto,
    currentUser: User,
  ): Promise<Sheet> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const levelChanged = dto.level !== undefined && dto.level !== sheet.level;

    if (dto.name !== undefined) {
      sheet.name = dto.name;
    }
    if (dto.referenceImage !== undefined) {
      sheet.referenceImage = dto.referenceImage;
    }
    if (dto.level !== undefined) {
      sheet.level = dto.level;
    }
    if (dto.currentHitPoints !== undefined) {
      sheet.currentHitPoints = dto.currentHitPoints;
    }
    if (dto.temporaryHitPoints !== undefined) {
      sheet.temporaryHitPoints = dto.temporaryHitPoints;
    }
    const coinsChanged =
      dto.pc !== undefined ||
      dto.pp !== undefined ||
      dto.po !== undefined ||
      dto.pl !== undefined;
    if (dto.pc !== undefined) {
      sheet.pc = dto.pc;
    }
    if (dto.pp !== undefined) {
      sheet.pp = dto.pp;
    }
    if (dto.po !== undefined) {
      sheet.po = dto.po;
    }
    if (dto.pl !== undefined) {
      sheet.pl = dto.pl;
    }
    if (coinsChanged) {
      await this.recomputeItemsAndLoadedVolume(sheet);

      const volumeLimit = this.computeVolumeLimit(sheet);
      if (Math.round(sheet.loadedVolume * 10) > Math.round(volumeLimit * 10)) {
        throw new ConflictException(
          'A quantidade de moedas informada supera o volume limite que a ficha pode carregar.',
        );
      }
    }
    if (dto.campaignId !== undefined) {
      sheet.campaign = dto.campaignId
        ? await this.findCampaignById(dto.campaignId)
        : null;
    }
    if (dto.armorClassKeyAttributeId !== undefined) {
      sheet.armorClassKeyAttribute = await this.findAttributeById(
        dto.armorClassKeyAttributeId,
      );
    }

    if (levelChanged) {
      await this.syncTrainingSlotsForLevel(sheet, sheet.level);
    }

    return this.sheetsRepository.save(sheet);
  }

  async linkRace(
    id: string,
    dto: LinkSheetRaceDto,
    currentUser: User,
  ): Promise<Sheet> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const race = await this.findRaceById(dto.raceId);

    const items = await this.improvementFlawsRepository.find({
      where: { ownerRace: { id: race.id } },
      relations: { type: true, property: { types: true } },
      order: { sortOrder: 'ASC' },
    });

    const toEntry = (
      item: ImprovementFlaw,
    ): SheetImprovementFlawSnapshotEntry => ({
      id: item.id,
      value: item.value,
      type: { id: item.type.id, name: item.type.name },
      property: { id: item.property.id, name: item.property.name },
      sourceName: race.name,
    });

    const improvements = items
      .filter((item) => item.category === ImprovementFlawCategory.IMPROVEMENT)
      .map(toEntry);
    const flaws = items
      .filter((item) => item.category === ImprovementFlawCategory.FLAW)
      .map(toEntry);

    sheet.race = race;
    sheet.melhorias = { ...sheet.melhorias, race: improvements };
    sheet.defeitos = { ...sheet.defeitos, race: flaws };

    await this.recomputeSheetAbilitySnapshots(sheet);

    return this.sheetsRepository.save(sheet);
  }

  async unlinkRace(id: string, currentUser: User): Promise<Sheet> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    sheet.race = null;
    sheet.melhorias = { ...sheet.melhorias, race: [] };
    sheet.defeitos = { ...sheet.defeitos, race: [] };

    await this.recomputeSheetAbilitySnapshots(sheet);

    return this.sheetsRepository.save(sheet);
  }

  async linkBiography(
    id: string,
    dto: LinkSheetBiographyDto,
    currentUser: User,
  ): Promise<Sheet> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const biography = await this.biographiesRepository.findOneBy({
      id: dto.biographyId,
    });
    if (!biography) {
      throw new NotFoundException('Biografia não encontrada.');
    }

    const selectedImprovement = await this.improvementFlawsRepository.findOne({
      where: { id: dto.selectedImprovementId },
      relations: {
        type: true,
        property: { types: true },
        ownerBiography: true,
      },
    });
    if (!selectedImprovement) {
      throw new NotFoundException('Melhoria selecionada não encontrada.');
    }
    if (
      selectedImprovement.ownerBiography?.id !== biography.id ||
      selectedImprovement.category !== ImprovementFlawCategory.IMPROVEMENT ||
      selectedImprovement.type.name !== ATTRIBUTE_TYPE_NAME
    ) {
      throw new ConflictException(
        'A melhoria selecionada não pertence à biografia informada ou não é do tipo Atributo.',
      );
    }

    const attributeType = await this.improvementFlawTypesRepository.findOneBy({
      name: ATTRIBUTE_TYPE_NAME,
    });
    if (!attributeType) {
      throw new NotFoundException('Tipo Atributo não encontrado.');
    }

    const freeImprovementProperty =
      await this.improvementFlawPropertiesRepository.findOne({
        where: { id: dto.freeImprovementPropertyId },
        relations: { types: true },
      });
    if (!freeImprovementProperty) {
      throw new NotFoundException('Propriedade não encontrada.');
    }
    if (
      !freeImprovementProperty.types.some(
        (type) => type.id === attributeType.id,
      )
    ) {
      throw new ConflictException(
        'A propriedade selecionada não é compatível com o tipo Atributo.',
      );
    }

    const otherBiographyImprovements =
      await this.improvementFlawsRepository.find({
        where: {
          ownerBiography: { id: biography.id },
          category: ImprovementFlawCategory.IMPROVEMENT,
          type: { name: Not(ATTRIBUTE_TYPE_NAME) },
        },
        relations: { type: true, property: { types: true } },
        order: { sortOrder: 'ASC' },
      });

    const toBiographyEntry = (
      item: ImprovementFlaw,
    ): SheetImprovementFlawSnapshotEntry => ({
      id: item.id,
      value: item.value,
      type: { id: item.type.id, name: item.type.name },
      property: { id: item.property.id, name: item.property.name },
      sourceName: biography.name,
    });

    const biographyImprovements: SheetImprovementFlawSnapshotEntry[] = [
      {
        id: selectedImprovement.id,
        value: selectedImprovement.value,
        type: {
          id: selectedImprovement.type.id,
          name: selectedImprovement.type.name,
        },
        property: {
          id: selectedImprovement.property.id,
          name: selectedImprovement.property.name,
        },
        sourceName: biography.name,
      },
      {
        id: null,
        value: FREE_IMPROVEMENT_VALUE,
        type: { id: attributeType.id, name: attributeType.name },
        property: {
          id: freeImprovementProperty.id,
          name: freeImprovementProperty.name,
        },
        sourceName: biography.name,
      },
      ...otherBiographyImprovements.map(toBiographyEntry),
    ];

    sheet.biography = biography;
    sheet.melhorias = { ...sheet.melhorias, biography: biographyImprovements };
    sheet.defeitos = { ...sheet.defeitos, biography: [] };

    await this.recomputeSheetAbilitySnapshots(sheet);

    return this.sheetsRepository.save(sheet);
  }

  async unlinkBiography(id: string, currentUser: User): Promise<Sheet> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    sheet.biography = null;
    sheet.melhorias = { ...sheet.melhorias, biography: [] };
    sheet.defeitos = { ...sheet.defeitos, biography: [] };

    await this.recomputeSheetAbilitySnapshots(sheet);

    return this.sheetsRepository.save(sheet);
  }

  async resolveProficiencyAdjustment(
    id: string,
    adjustmentId: string,
    dto: ResolveProficiencyAdjustmentDto,
    currentUser: User,
  ): Promise<Sheet> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const adjustmentIndex = sheet.proficienciasAjustadas.findIndex(
      (adjustment) => adjustment.id === adjustmentId,
    );
    if (adjustmentIndex === -1) {
      throw new NotFoundException('Ajuste de proficiência não encontrado.');
    }

    const occupiedPropertyIds = new Set<string>();
    const activeGroups: SheetProficiencySnapshotEntry[][] = [
      sheet.proficiencias.race,
      sheet.proficiencias.biography,
      sheet.proficiencias.trainings,
      sheet.proficiencias.talents,
      sheet.proficiencias.characteristics,
    ];
    for (const group of activeGroups) {
      for (const entry of group) {
        occupiedPropertyIds.add(entry.property.id);
      }
    }
    sheet.proficienciasAjustadas.forEach((adjustment, index) => {
      if (index !== adjustmentIndex && adjustment.adjustedPropertyId) {
        occupiedPropertyIds.add(adjustment.adjustedPropertyId);
      }
    });

    if (occupiedPropertyIds.has(dto.propertyId)) {
      throw new ConflictException(
        'A propriedade selecionada já está aplicada na ficha.',
      );
    }

    const property = await this.proficiencyPropertiesRepository.findOneBy({
      id: dto.propertyId,
    });
    if (!property) {
      throw new NotFoundException(
        'Propriedade de proficiência não encontrada.',
      );
    }

    const currentAdjustment = sheet.proficienciasAjustadas[adjustmentIndex];
    const updatedAdjustment: SheetProficiencyAdjustment = {
      ...currentAdjustment,
      adjustedPropertyId: property.id,
      adjustedProperty: { id: property.id, name: property.name },
    };

    sheet.proficienciasAjustadas = sheet.proficienciasAjustadas.map(
      (adjustment, index) =>
        index === adjustmentIndex ? updatedAdjustment : adjustment,
    );

    return this.sheetsRepository.save(sheet);
  }

  async updateKnowledgeNote(
    id: string,
    knowledgeId: string,
    dto: UpdateSheetKnowledgeNoteDto,
    currentUser: User,
  ): Promise<Sheet> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const allEntries: SheetKnowledgeSnapshotEntry[] = [
      ...sheet.saberes.race,
      ...sheet.saberes.biography,
      ...sheet.saberes.trainings,
      ...sheet.saberes.talents,
      ...sheet.saberes.characteristics,
    ];
    const entry = allEntries.find((item) => item.id === knowledgeId);
    if (!entry) {
      throw new NotFoundException('Saber não encontrado nesta ficha.');
    }

    if (!entry.editable) {
      throw new ConflictException(
        'Este saber não é editável e não pode receber uma nota.',
      );
    }

    sheet.saberesAnotacoes = {
      ...sheet.saberesAnotacoes,
      [knowledgeId]: dto.note,
    };

    return this.sheetsRepository.save(sheet);
  }

  async getAbilities(
    id: string,
    currentUser: User,
  ): Promise<SheetAbilitiesData> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const slots = await this.loadSlotsWithTags(sheet.id);
    const extras = await this.loadExtrasWithTags(sheet.id);
    const computed = await this.computeSheetAbilities(sheet, slots, extras);

    return {
      characteristics: computed.characteristics,
      trainings: computed.trainings,
      talents: computed.talents,
    };
  }

  private bucketForEntityType(
    entityType: ReferenceableEntityType,
  ): SheetAbilityBucketKey {
    if (entityType === ReferenceableEntityType.TRAINING) {
      return 'trainings';
    }
    if (entityType === ReferenceableEntityType.TALENT) {
      return 'talents';
    }
    return 'characteristics';
  }

  /**
   * Lista, paginada, candidatos do catálogo (Característica/Treinamento/
   * Talento, conforme `query.entityType`) a serem vinculados a `sheet`, já
   * com `alreadyPresent`/`requirementsMet` (incluindo a regra de tag "Raça")
   * avaliados por candidato. Filtro de nome/level/tags reaproveita o mesmo
   * padrão de `TalentsService.findAllPaginated`/`TrainingsService.findAllPaginated`/
   * `CharacteristicsService.findAllPaginated`, mas a paginação (`skip`/`take`)
   * é aplicada em memória, depois de avaliar elegibilidade para todo o
   * conjunto filtrado por nome/level/tags — necessário porque `onlyEligible`
   * (quando ativo) precisa refletir no `total` retornado.
   */
  async findAbilityCandidates(
    id: string,
    query: FindSheetAbilityCandidatesQueryDto,
    currentUser: User,
  ): Promise<PaginatedSheetAbilityCandidates> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const allowedTypes = new Set<ReferenceableEntityType>([
      ReferenceableEntityType.TRAINING,
      ReferenceableEntityType.TALENT,
      ReferenceableEntityType.CHARACTERISTIC,
    ]);
    if (!allowedTypes.has(query.entityType)) {
      throw new BadRequestException(
        'Apenas itens do tipo treinamento, talento ou característica podem ser avaliados neste endpoint.',
      );
    }

    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    const uniqueTagIds = hasTagFilter ? [...new Set(query.tagIds)] : [];

    let candidateIds: string[];
    let candidateEntities: { id: string; name: string; level: number }[];
    let tagsById: Map<string, Tag[]>;

    if (query.entityType === ReferenceableEntityType.CHARACTERISTIC) {
      const queryBuilder =
        this.characteristicsRepository.createQueryBuilder('characteristic');
      if (query.name) {
        queryBuilder.andWhere('characteristic.name ILIKE :name', {
          name: `%${query.name}%`,
        });
      }
      if (query.level !== undefined) {
        queryBuilder.andWhere('characteristic.level = :level', {
          level: query.level,
        });
      }
      if (hasTagFilter) {
        queryBuilder
          .innerJoin(
            'characteristic_tags',
            'characteristic_tag_filter',
            'characteristic_tag_filter.characteristic_id = characteristic.id AND characteristic_tag_filter.tag_id IN (:...tagIds)',
            { tagIds: uniqueTagIds },
          )
          .groupBy('characteristic.id')
          .having(
            'COUNT(DISTINCT characteristic_tag_filter.tag_id) = :tagCount',
            { tagCount: uniqueTagIds.length },
          );
      }
      const rows = await queryBuilder
        .select(['characteristic.id', 'characteristic.name'])
        .orderBy('characteristic.name', 'ASC')
        .getMany();
      candidateIds = rows.map((row) => row.id);
      candidateEntities = await this.characteristicsRepository.find({
        where: { id: In(candidateIds) },
        order: { name: 'ASC' },
      });
      tagsById = await loadOrderedTagsMap(
        this.characteristicTagsRepository,
        candidateIds,
        'characteristic',
      );
    } else if (query.entityType === ReferenceableEntityType.TRAINING) {
      const queryBuilder =
        this.trainingsRepository.createQueryBuilder('training');
      if (query.name) {
        queryBuilder.andWhere('training.name ILIKE :name', {
          name: `%${query.name}%`,
        });
      }
      if (query.level !== undefined) {
        queryBuilder.andWhere('training.level = :level', {
          level: query.level,
        });
      }
      if (hasTagFilter) {
        queryBuilder
          .innerJoin(
            'training_tags',
            'training_tag_filter',
            'training_tag_filter.training_id = training.id AND training_tag_filter.tag_id IN (:...tagIds)',
            { tagIds: uniqueTagIds },
          )
          .groupBy('training.id')
          .having('COUNT(DISTINCT training_tag_filter.tag_id) = :tagCount', {
            tagCount: uniqueTagIds.length,
          });
      }
      const rows = await queryBuilder
        .select(['training.id', 'training.name'])
        .orderBy('training.name', 'ASC')
        .getMany();
      candidateIds = rows.map((row) => row.id);
      candidateEntities = await this.trainingsRepository.find({
        where: { id: In(candidateIds) },
        order: { name: 'ASC' },
      });
      tagsById = await loadOrderedTagsMap(
        this.trainingTagsRepository,
        candidateIds,
        'training',
      );
    } else {
      const queryBuilder = this.talentsRepository.createQueryBuilder('talent');
      if (query.name) {
        queryBuilder.andWhere('talent.name ILIKE :name', {
          name: `%${query.name}%`,
        });
      }
      if (query.level !== undefined) {
        queryBuilder.andWhere('talent.level = :level', {
          level: query.level,
        });
      }
      if (hasTagFilter) {
        queryBuilder
          .innerJoin(
            'talent_tags',
            'talent_tag_filter',
            'talent_tag_filter.talent_id = talent.id AND talent_tag_filter.tag_id IN (:...tagIds)',
            { tagIds: uniqueTagIds },
          )
          .groupBy('talent.id')
          .having('COUNT(DISTINCT talent_tag_filter.tag_id) = :tagCount', {
            tagCount: uniqueTagIds.length,
          });
      }
      const rows = await queryBuilder
        .select(['talent.id', 'talent.name'])
        .orderBy('talent.name', 'ASC')
        .getMany();
      candidateIds = rows.map((row) => row.id);
      candidateEntities = await this.talentsRepository.find({
        where: { id: In(candidateIds) },
        order: { name: 'ASC' },
      });
      tagsById = await loadOrderedTagsMap(
        this.talentTagsRepository,
        candidateIds,
        'talent',
      );
    }

    if (candidateIds.length === 0) {
      return { data: [], total: 0, page, perPage };
    }

    const slots = await this.loadSlotsWithTags(sheet.id);
    const extras = await this.loadExtrasWithTags(sheet.id);
    const computed = await this.computeSheetAbilities(sheet, slots, extras);

    const requirementsByOwnerKey =
      await this.entityLinksService.loadLinksForOwnersBatched(
        candidateIds.map((candidateId) => ({
          entityType: query.entityType,
          id: candidateId,
        })),
        [EntityLinkType.REQUIREMENT],
      );

    const entitiesById = new Map(
      candidateEntities.map((entity) => [entity.id, entity]),
    );
    const bucketKey = this.bucketForEntityType(query.entityType);

    const evaluated: SheetAbilityCandidateResult[] = candidateIds
      .map((candidateId) => entitiesById.get(candidateId))
      .filter(
        (entity): entity is { id: string; name: string; level: number } =>
          entity !== undefined,
      )
      .map((entity) => {
        const tags = (tagsById.get(entity.id) ?? []).map((tag) =>
          TagResponseDto.fromEntity(tag),
        );
        const requirements =
          requirementsByOwnerKey.get(
            `${EntityLinkType.REQUIREMENT}:${query.entityType}:${entity.id}`,
          ) ?? [];
        const alreadyPresent = computed.presentIdsByBucket[bucketKey].has(
          entity.id,
        );
        const requirementsMet = this.evaluateAbilityRequirements(
          {
            id: entity.id,
            entityType: query.entityType,
            level: entity.level,
            tags,
            requirements,
          },
          sheet,
          computed.presentIdsByBucket,
        );
        return {
          id: entity.id,
          name: entity.name,
          level: entity.level,
          tags,
          alreadyPresent,
          requirementsMet,
        };
      });

    const filtered = query.onlyEligible
      ? evaluated.filter((candidate) => candidate.requirementsMet)
      : evaluated;

    const total = filtered.length;
    const data = filtered.slice(
      (page - 1) * perPage,
      (page - 1) * perPage + perPage,
    );

    return { data, total, page, perPage };
  }

  async addCharacteristicExtra(
    id: string,
    dto: AddCharacteristicExtraDto,
    currentUser: User,
  ): Promise<SheetAbilityMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const characteristic = await this.findCharacteristicWithTagsById(
      dto.characteristicId,
    );

    const slots = await this.loadSlotsWithTags(sheet.id);
    const extras = await this.loadExtrasWithTags(sheet.id);
    const computed = await this.computeSheetAbilities(sheet, slots, extras);

    if (computed.presentIdsByBucket.characteristics.has(characteristic.id)) {
      throw new ConflictException(
        'Este item já está vinculado à ficha, seja por herança, slot ou extra.',
      );
    }

    const requirementsByOwnerKey =
      await this.entityLinksService.loadLinksForOwnersBatched(
        [
          {
            entityType: ReferenceableEntityType.CHARACTERISTIC,
            id: characteristic.id,
          },
        ],
        [EntityLinkType.REQUIREMENT],
      );
    const requirementsMet = this.evaluateAbilityRequirements(
      {
        id: characteristic.id,
        entityType: ReferenceableEntityType.CHARACTERISTIC,
        level: characteristic.level,
        tags: characteristic.tags,
        requirements:
          requirementsByOwnerKey.get(
            `${EntityLinkType.REQUIREMENT}:${ReferenceableEntityType.CHARACTERISTIC}:${characteristic.id}`,
          ) ?? [],
      },
      sheet,
      computed.presentIdsByBucket,
    );
    if (!requirementsMet) {
      throw new ConflictException(
        'A ficha não atende aos requisitos deste item.',
      );
    }

    const extra = this.sheetAbilityExtrasRepository.create({
      sheet,
      entityType: SheetAbilityBucketType.CHARACTERISTIC,
      characteristic,
      training: null,
      talent: null,
    });
    await this.sheetAbilityExtrasRepository.save(extra);

    const abilities = await this.recomputeSheetAbilitySnapshots(sheet);
    const savedSheet = await this.sheetsRepository.save(sheet);
    return { sheet: savedSheet, abilities };
  }

  async removeCharacteristicExtra(
    id: string,
    characteristicId: string,
    currentUser: User,
  ): Promise<SheetAbilityMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const extra = await this.sheetAbilityExtrasRepository.findOne({
      where: {
        sheet: { id: sheet.id },
        characteristic: { id: characteristicId },
      },
    });
    if (!extra) {
      throw new NotFoundException(
        'Característica não encontrada como extra desta ficha.',
      );
    }
    await this.sheetAbilityExtrasRepository.remove(extra);

    const abilities = await this.recomputeSheetAbilitySnapshots(sheet);
    const savedSheet = await this.sheetsRepository.save(sheet);
    return { sheet: savedSheet, abilities };
  }

  async addTrainingExtra(
    id: string,
    dto: AddTrainingExtraDto,
    currentUser: User,
  ): Promise<SheetAbilityMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const training = await this.findTrainingWithTagsById(dto.trainingId);

    const slots = await this.loadSlotsWithTags(sheet.id);
    const extras = await this.loadExtrasWithTags(sheet.id);
    const computed = await this.computeSheetAbilities(sheet, slots, extras);

    if (computed.presentIdsByBucket.trainings.has(training.id)) {
      throw new ConflictException(
        'Este item já está vinculado à ficha, seja por herança, slot ou extra.',
      );
    }

    const requirementsByOwnerKey =
      await this.entityLinksService.loadLinksForOwnersBatched(
        [{ entityType: ReferenceableEntityType.TRAINING, id: training.id }],
        [EntityLinkType.REQUIREMENT],
      );
    const requirementsMet = this.evaluateAbilityRequirements(
      {
        id: training.id,
        entityType: ReferenceableEntityType.TRAINING,
        level: training.level,
        tags: training.tags,
        requirements:
          requirementsByOwnerKey.get(
            `${EntityLinkType.REQUIREMENT}:${ReferenceableEntityType.TRAINING}:${training.id}`,
          ) ?? [],
      },
      sheet,
      computed.presentIdsByBucket,
    );
    if (!requirementsMet) {
      throw new ConflictException(
        'A ficha não atende aos requisitos deste item.',
      );
    }

    const extra = this.sheetAbilityExtrasRepository.create({
      sheet,
      entityType: SheetAbilityBucketType.TRAINING,
      training,
      talent: null,
      characteristic: null,
    });
    await this.sheetAbilityExtrasRepository.save(extra);

    const abilities = await this.recomputeSheetAbilitySnapshots(sheet);
    const savedSheet = await this.sheetsRepository.save(sheet);
    return { sheet: savedSheet, abilities };
  }

  async removeTrainingExtra(
    id: string,
    trainingId: string,
    currentUser: User,
  ): Promise<SheetAbilityMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const extra = await this.sheetAbilityExtrasRepository.findOne({
      where: { sheet: { id: sheet.id }, training: { id: trainingId } },
    });
    if (!extra) {
      throw new NotFoundException(
        'Treinamento não encontrado como extra desta ficha.',
      );
    }
    await this.sheetAbilityExtrasRepository.remove(extra);

    const abilities = await this.recomputeSheetAbilitySnapshots(sheet);
    const savedSheet = await this.sheetsRepository.save(sheet);
    return { sheet: savedSheet, abilities };
  }

  async addTalentExtra(
    id: string,
    dto: AddTalentExtraDto,
    currentUser: User,
  ): Promise<SheetAbilityMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const talent = await this.findTalentWithTagsById(dto.talentId);

    const slots = await this.loadSlotsWithTags(sheet.id);
    const extras = await this.loadExtrasWithTags(sheet.id);
    const computed = await this.computeSheetAbilities(sheet, slots, extras);

    if (computed.presentIdsByBucket.talents.has(talent.id)) {
      throw new ConflictException(
        'Este item já está vinculado à ficha, seja por herança, slot ou extra.',
      );
    }

    const requirementsByOwnerKey =
      await this.entityLinksService.loadLinksForOwnersBatched(
        [{ entityType: ReferenceableEntityType.TALENT, id: talent.id }],
        [EntityLinkType.REQUIREMENT],
      );
    const requirementsMet = this.evaluateAbilityRequirements(
      {
        id: talent.id,
        entityType: ReferenceableEntityType.TALENT,
        level: talent.level,
        tags: talent.tags,
        requirements:
          requirementsByOwnerKey.get(
            `${EntityLinkType.REQUIREMENT}:${ReferenceableEntityType.TALENT}:${talent.id}`,
          ) ?? [],
      },
      sheet,
      computed.presentIdsByBucket,
    );
    if (!requirementsMet) {
      throw new ConflictException(
        'A ficha não atende aos requisitos deste item.',
      );
    }

    const extra = this.sheetAbilityExtrasRepository.create({
      sheet,
      entityType: SheetAbilityBucketType.TALENT,
      talent,
      training: null,
      characteristic: null,
    });
    await this.sheetAbilityExtrasRepository.save(extra);

    const abilities = await this.recomputeSheetAbilitySnapshots(sheet);
    const savedSheet = await this.sheetsRepository.save(sheet);
    return { sheet: savedSheet, abilities };
  }

  async removeTalentExtra(
    id: string,
    talentId: string,
    currentUser: User,
  ): Promise<SheetAbilityMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const extra = await this.sheetAbilityExtrasRepository.findOne({
      where: { sheet: { id: sheet.id }, talent: { id: talentId } },
    });
    if (!extra) {
      throw new NotFoundException(
        'Talento não encontrado como extra desta ficha.',
      );
    }
    await this.sheetAbilityExtrasRepository.remove(extra);

    const abilities = await this.recomputeSheetAbilitySnapshots(sheet);
    const savedSheet = await this.sheetsRepository.save(sheet);
    return { sheet: savedSheet, abilities };
  }

  async fillTrainingSlot(
    id: string,
    slotIndex: number,
    dto: FillTrainingSlotDto,
    currentUser: User,
  ): Promise<SheetAbilityMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const slot = await this.sheetTrainingSlotsRepository.findOne({
      where: { sheet: { id: sheet.id }, slotIndex },
      relations: { training: true },
    });
    if (!slot) {
      throw new NotFoundException(
        'Slot de treinamento não encontrado nesta ficha.',
      );
    }
    if (slot.training) {
      throw new ConflictException('Este slot já está preenchido.');
    }

    const training = await this.findTrainingWithTagsById(dto.trainingId);

    const slots = await this.loadSlotsWithTags(sheet.id);
    const extras = await this.loadExtrasWithTags(sheet.id);
    const computed = await this.computeSheetAbilities(sheet, slots, extras);

    if (computed.presentIdsByBucket.trainings.has(training.id)) {
      throw new ConflictException(
        'Este item já está vinculado à ficha, seja por herança, slot ou extra.',
      );
    }

    const requirementsByOwnerKey =
      await this.entityLinksService.loadLinksForOwnersBatched(
        [{ entityType: ReferenceableEntityType.TRAINING, id: training.id }],
        [EntityLinkType.REQUIREMENT],
      );
    const requirementsMet = this.evaluateAbilityRequirements(
      {
        id: training.id,
        entityType: ReferenceableEntityType.TRAINING,
        level: training.level,
        tags: training.tags,
        requirements:
          requirementsByOwnerKey.get(
            `${EntityLinkType.REQUIREMENT}:${ReferenceableEntityType.TRAINING}:${training.id}`,
          ) ?? [],
      },
      sheet,
      computed.presentIdsByBucket,
    );
    if (!requirementsMet) {
      throw new ConflictException(
        'A ficha não atende aos requisitos deste item.',
      );
    }

    slot.training = training;
    await this.sheetTrainingSlotsRepository.save(slot);

    const abilities = await this.recomputeSheetAbilitySnapshots(sheet);
    const savedSheet = await this.sheetsRepository.save(sheet);
    return { sheet: savedSheet, abilities };
  }

  async emptyTrainingSlot(
    id: string,
    slotIndex: number,
    currentUser: User,
  ): Promise<SheetAbilityMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const slot = await this.sheetTrainingSlotsRepository.findOne({
      where: { sheet: { id: sheet.id }, slotIndex },
      relations: { training: true },
    });
    if (!slot || !slot.training) {
      throw new NotFoundException(
        'Slot de treinamento vazio ou não encontrado nesta ficha.',
      );
    }

    slot.training = null;
    await this.sheetTrainingSlotsRepository.save(slot);

    const abilities = await this.recomputeSheetAbilitySnapshots(sheet);
    const savedSheet = await this.sheetsRepository.save(sheet);
    return { sheet: savedSheet, abilities };
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }
    await this.sheetsRepository.delete({ id });
  }

  private roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
  }

  /**
   * Soma o `value` das entradas de melhoria/defeito do tipo Atributo cuja
   * propriedade seja `propertyName`, considerando todos os buckets do
   * snapshot (race/biography/trainings/talents/characteristics) — mesmo
   * critério (`type.name === ATTRIBUTE_TYPE_NAME`) já usado em
   * `linkBiography` para identificar melhorias de Atributo.
   */
  private sumAttributePropertyValue(
    snapshot: SheetImprovementFlawSnapshot,
    propertyName: string,
  ): number {
    const buckets: (keyof SheetImprovementFlawSnapshot)[] = [
      'race',
      'biography',
      'trainings',
      'talents',
      'characteristics',
    ];
    let total = 0;
    for (const bucket of buckets) {
      for (const entry of snapshot[bucket]) {
        if (
          entry.type.name === ATTRIBUTE_TYPE_NAME &&
          entry.property.name === propertyName
        ) {
          total += entry.value;
        }
      }
    }
    return total;
  }

  /**
   * Volume Limite = max(0, modificador de Força + 10), com modificador =
   * floor((baseValue - 10) / 2) e baseValue = 10 + Σmelhorias − Σdefeitos de
   * Força (mesma fonte — `sheet.melhorias`/`sheet.defeitos` — já usada para
   * os demais cálculos de atributo do serviço).
   */
  private computeVolumeLimit(sheet: Sheet): number {
    const improvements = this.sumAttributePropertyValue(
      sheet.melhorias,
      STRENGTH_PROPERTY_NAME,
    );
    const flaws = this.sumAttributePropertyValue(
      sheet.defeitos,
      STRENGTH_PROPERTY_NAME,
    );
    const baseValue = 10 + improvements - flaws;
    const modifier = Math.floor((baseValue - 10) / 2);
    return Math.max(0, modifier + 10);
  }

  /**
   * Recalcula `sheet.itemsVolume`/`sheet.loadedVolume` sempre a partir da
   * fonte (soma de `quantity * unitVolume` de todos os `SheetInventoryItem`
   * da ficha, consultados do banco), nunca por incremento/decremento sobre o
   * valor anterior. Aceita um repositório opcional para ser chamado dentro de
   * uma transação (`manager.getRepository(SheetInventoryItem)`).
   */
  private async recomputeItemsAndLoadedVolume(
    sheet: Sheet,
    itemsRepository: Repository<SheetInventoryItem> = this
      .sheetInventoryItemsRepository,
  ): Promise<void> {
    const items = await itemsRepository.find({
      where: { sheet: { id: sheet.id } },
    });
    const rawItemsVolume = items.reduce(
      (sum, item) => sum + item.quantity * item.unitVolume,
      0,
    );
    sheet.itemsVolume = this.roundToOneDecimal(rawItemsVolume);
    const coinsTotal = sheet.pc + sheet.pp + sheet.po + sheet.pl;
    sheet.loadedVolume = Math.floor(coinsTotal / 1000) + sheet.itemsVolume;
  }

  /**
   * Normaliza um valor (ordenando recursivamente as chaves de objetos) para
   * comparação de igualdade estrutural via string — usado para detectar
   * empilhamento de itens com `data` idêntico, independentemente da ordem de
   * inserção das chaves.
   */
  private normalizeForComparison(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeForComparison(item));
    }
    if (value !== null && typeof value === 'object') {
      const sortedEntries = Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => [key, this.normalizeForComparison(val)] as const);
      return Object.fromEntries(sortedEntries);
    }
    return value;
  }

  private stableStringify(value: unknown): string {
    return JSON.stringify(this.normalizeForComparison(value));
  }

  /**
   * Serializa um `*ResponseDto` para o formato persistido em `data`, sempre
   * sem `id`/`createdAt`/`updatedAt` — tanto para item avulso (onde essas
   * chaves já vêm ausentes, pois a entidade nunca é salva) quanto para item
   * existente do catálogo (onde, sem essa remoção, ficariam presentes com o
   * id/timestamps do registro de catálogo de origem, não do
   * `SheetInventoryItem`). Mantém o mesmo formato de snapshot nos dois
   * fluxos.
   */
  private toPlainSnapshot(dto: object): Record<string, unknown> {
    const plain = JSON.parse(JSON.stringify(dto)) as Record<string, unknown>;
    delete plain.id;
    delete plain.createdAt;
    delete plain.updatedAt;
    return plain;
  }

  /**
   * Valida manualmente `payload` (item avulso) contra o `Create*Dto` da
   * categoria informada, reaproveitando as mesmas regras de validação do
   * cadastro do catálogo — sem persistir nada nos módulos de catálogo.
   */
  private async validateCustomData<T extends object>(
    cls: new () => T,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const instance = plainToInstance(cls, payload);
    const errors = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const messages = errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .filter((message): message is string => !!message);
      throw new BadRequestException(
        messages.length > 0
          ? messages
          : 'Dados do item avulso inválidos para a categoria informada.',
      );
    }
    return instance;
  }

  private async buildSnapshotFromCatalogItem(
    category: SheetInventoryItemCategory,
    catalogItemId: string,
  ): Promise<Record<string, unknown>> {
    switch (category) {
      case SheetInventoryItemCategory.UTILITY: {
        const entity = await this.utilitiesService.findById(catalogItemId);
        if (!entity) {
          throw new NotFoundException('Utilitário do catálogo não encontrado.');
        }
        return this.toPlainSnapshot(UtilityResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.CONSUMABLE: {
        const entity = await this.consumablesService.findById(catalogItemId);
        if (!entity) {
          throw new NotFoundException('Consumível do catálogo não encontrado.');
        }
        return this.toPlainSnapshot(ConsumableResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.MATERIAL: {
        const entity = await this.materialsService.findById(catalogItemId);
        if (!entity) {
          throw new NotFoundException('Material do catálogo não encontrado.');
        }
        return this.toPlainSnapshot(MaterialResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.AMMUNITION: {
        const entity = await this.ammunitionService.findById(catalogItemId);
        if (!entity) {
          throw new NotFoundException(
            'Item de munição do catálogo não encontrado.',
          );
        }
        return this.toPlainSnapshot(AmmunitionResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.WEAPON: {
        const entity = await this.weaponsService.findById(catalogItemId);
        if (!entity) {
          throw new NotFoundException('Arma do catálogo não encontrada.');
        }
        return this.toPlainSnapshot(WeaponResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.ARMOR: {
        const entity = await this.armorsService.findById(catalogItemId);
        if (!entity) {
          throw new NotFoundException('Armadura do catálogo não encontrada.');
        }
        return this.toPlainSnapshot(ArmorResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.ACCESSORY: {
        const entity = await this.accessoriesService.findById(catalogItemId);
        if (!entity) {
          throw new NotFoundException('Acessório do catálogo não encontrado.');
        }
        return this.toPlainSnapshot(AccessoryResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.SHIELD: {
        const entity = await this.shieldsService.findById(catalogItemId);
        if (!entity) {
          throw new NotFoundException('Escudo do catálogo não encontrado.');
        }
        return this.toPlainSnapshot(ShieldResponseDto.fromEntity(entity));
      }
      default:
        throw new BadRequestException('Categoria de item inválida.');
    }
  }

  private async buildSnapshotFromCustomData(
    category: SheetInventoryItemCategory,
    customData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    switch (category) {
      case SheetInventoryItemCategory.UTILITY: {
        const dto = await this.validateCustomData(CreateUtilityDto, customData);
        const entity = await this.utilitiesService.buildSnapshotFromDto(dto);
        return this.toPlainSnapshot(UtilityResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.CONSUMABLE: {
        const dto = await this.validateCustomData(
          CreateConsumableDto,
          customData,
        );
        const entity = await this.consumablesService.buildSnapshotFromDto(dto);
        return this.toPlainSnapshot(ConsumableResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.MATERIAL: {
        const dto = await this.validateCustomData(
          CreateMaterialDto,
          customData,
        );
        const entity = await this.materialsService.buildSnapshotFromDto(dto);
        return this.toPlainSnapshot(MaterialResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.AMMUNITION: {
        const dto = await this.validateCustomData(
          CreateAmmunitionDto,
          customData,
        );
        const entity = await this.ammunitionService.buildSnapshotFromDto(dto);
        return this.toPlainSnapshot(AmmunitionResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.WEAPON: {
        const dto = await this.validateCustomData(CreateWeaponDto, customData);
        const entity = await this.weaponsService.buildSnapshotFromDto(dto);
        return this.toPlainSnapshot(WeaponResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.ARMOR: {
        const dto = await this.validateCustomData(CreateArmorDto, customData);
        const entity = await this.armorsService.buildSnapshotFromDto(dto);
        return this.toPlainSnapshot(ArmorResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.ACCESSORY: {
        const dto = await this.validateCustomData(
          CreateAccessoryDto,
          customData,
        );
        const entity = await this.accessoriesService.buildSnapshotFromDto(dto);
        return this.toPlainSnapshot(AccessoryResponseDto.fromEntity(entity));
      }
      case SheetInventoryItemCategory.SHIELD: {
        const dto = await this.validateCustomData(CreateShieldDto, customData);
        const entity = await this.shieldsService.buildSnapshotFromDto(dto);
        return this.toPlainSnapshot(ShieldResponseDto.fromEntity(entity));
      }
      default:
        throw new BadRequestException('Categoria de item inválida.');
    }
  }

  /**
   * Resolve o snapshot (`data`) e o volume unitário do item a adicionar, a
   * partir de `catalogItemId` (item existente do catálogo) ou `customData`
   * (item avulso, validado contra o `Create*Dto` da categoria). O volume
   * unitário é extraído de `data.volume`; quando ausente/nulo (campo
   * opcional em todas as 8 categorias), é tratado como `0` na soma, sem
   * impedir a adição — `volume` é nullable no catálogo, e todo registro das
   * 5 categorias que ganharam a coluna nesta mesma entrega nasce nulo.
   */
  private async resolveSnapshotForAdd(
    dto: AddSheetInventoryItemDto,
  ): Promise<{ data: Record<string, unknown>; unitVolume: number }> {
    if (dto.catalogItemId && dto.customData) {
      throw new BadRequestException(
        'Informe catalogItemId (item do catálogo) ou customData (item avulso), nunca os dois.',
      );
    }
    if (!dto.catalogItemId && !dto.customData) {
      throw new BadRequestException(
        'Informe catalogItemId (item do catálogo) ou customData (item avulso).',
      );
    }

    const data = dto.catalogItemId
      ? await this.buildSnapshotFromCatalogItem(dto.category, dto.catalogItemId)
      : await this.buildSnapshotFromCustomData(dto.category, dto.customData!);

    const rawVolume = data.volume;
    const unitVolume =
      typeof rawVolume === 'number' && Number.isFinite(rawVolume)
        ? rawVolume
        : 0;

    return { data, unitVolume };
  }

  private async buildInventoryList(
    sheetId: string,
    query?: FindSheetInventoryItemsQueryDto,
  ): Promise<SheetInventoryListResult> {
    const allItems = await this.sheetInventoryItemsRepository.find({
      where: { sheet: { id: sheetId } },
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    const counts = Object.values(SheetInventoryItemCategory).reduce(
      (acc, category) => {
        acc[category] = 0;
        return acc;
      },
      {} as Record<SheetInventoryItemCategory, number>,
    );
    for (const item of allItems) {
      counts[item.category] += 1;
    }

    let items = allItems;
    if (query?.category) {
      items = items.filter((item) => item.category === query.category);
    }
    if (query?.equippedOnly) {
      items = items.filter((item) => item.equipped);
    }

    return { counts, items };
  }

  async listInventoryItems(
    id: string,
    query: FindSheetInventoryItemsQueryDto,
    currentUser: User,
  ): Promise<SheetInventoryListResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }
    return this.buildInventoryList(sheet.id, query);
  }

  async addInventoryItem(
    id: string,
    dto: AddSheetInventoryItemDto,
    currentUser: User,
  ): Promise<SheetInventoryMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const { data, unitVolume } = await this.resolveSnapshotForAdd(dto);
    const additionalVolume = this.roundToOneDecimal(unitVolume * dto.quantity);

    const savedSheet = await this.dataSource.transaction(async (manager) => {
      const itemsRepository = manager.getRepository(SheetInventoryItem);
      const sheetsRepository = manager.getRepository(Sheet);

      // Lock pessimista na linha da ficha: serializa adições concorrentes,
      // garantindo que a validação de volume limite abaixo sempre enxergue o
      // `itemsVolume`/moedas mais recentes já commitados. A entidade `sheet`
      // (com as relações já carregadas por `findAccessibleById`) é mantida —
      // só seus campos escalares relevantes são atualizados com o valor
      // travado da linha, para não perder `armorClassKeyAttribute`/
      // `createdBy`/etc. exigidos por `SheetResponseDto.fromEntity`.
      const lockedRow = await sheetsRepository.findOne({
        where: { id: sheet.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedRow) {
        throw new NotFoundException(
          'Ficha não encontrada ou não pertence ao usuário.',
        );
      }
      sheet.pc = lockedRow.pc;
      sheet.pp = lockedRow.pp;
      sheet.po = lockedRow.po;
      sheet.pl = lockedRow.pl;
      sheet.melhorias = lockedRow.melhorias;
      sheet.defeitos = lockedRow.defeitos;

      await this.recomputeItemsAndLoadedVolume(sheet, itemsRepository);

      const volumeLimit = this.computeVolumeLimit(sheet);
      const coinsTotal = sheet.pc + sheet.pp + sheet.po + sheet.pl;
      const projectedItemsVolume = this.roundToOneDecimal(
        sheet.itemsVolume + additionalVolume,
      );
      const projectedLoadedVolume =
        Math.floor(coinsTotal / 1000) + projectedItemsVolume;

      if (
        Math.round(projectedLoadedVolume * 10) > Math.round(volumeLimit * 10)
      ) {
        throw new ConflictException(
          'A quantidade solicitada supera o volume limite que a ficha pode carregar.',
        );
      }

      const existingItems = await itemsRepository.find({
        where: { sheet: { id: sheet.id }, category: dto.category },
      });
      const normalizedData = this.stableStringify(data);
      const stackTarget = existingItems.find(
        (candidate) => this.stableStringify(candidate.data) === normalizedData,
      );

      if (stackTarget) {
        stackTarget.quantity += dto.quantity;
        await itemsRepository.save(stackTarget);
      } else {
        const newItem = itemsRepository.create({
          sheet,
          category: dto.category,
          quantity: dto.quantity,
          equipped: false,
          unitVolume,
          data,
        });
        await itemsRepository.save(newItem);
      }

      await this.recomputeItemsAndLoadedVolume(sheet, itemsRepository);
      return sheetsRepository.save(sheet);
    });

    const inventory = await this.buildInventoryList(savedSheet.id);
    return { sheet: savedSheet, inventory };
  }

  async removeInventoryItem(
    id: string,
    itemId: string,
    dto: RemoveSheetInventoryItemDto,
    currentUser: User,
  ): Promise<SheetInventoryMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const savedSheet = await this.dataSource.transaction(async (manager) => {
      const itemsRepository = manager.getRepository(SheetInventoryItem);
      const sheetsRepository = manager.getRepository(Sheet);

      // Lock pessimista na linha da ficha adquirido antes de qualquer
      // leitura/escrita do `SheetInventoryItem`, na mesma ordem (Sheet →
      // SheetInventoryItem) usada em `addInventoryItem`, para evitar espera
      // circular entre uma adição/empilhamento e uma remoção concorrentes
      // sobre o mesmo item. Só os campos escalares usados por
      // `recomputeItemsAndLoadedVolume` (moedas) são ressincronizados a
      // partir do valor travado; a entidade `sheet` carregada por
      // `findAccessibleById` mantém suas relações para `SheetResponseDto.fromEntity`.
      const lockedRow = await sheetsRepository.findOne({
        where: { id: sheet.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedRow) {
        throw new NotFoundException(
          'Ficha não encontrada ou não pertence ao usuário.',
        );
      }
      sheet.pc = lockedRow.pc;
      sheet.pp = lockedRow.pp;
      sheet.po = lockedRow.po;
      sheet.pl = lockedRow.pl;

      const item = await itemsRepository.findOne({
        where: { id: itemId, sheet: { id: sheet.id } },
      });
      if (!item) {
        throw new NotFoundException(
          'Item de inventário não encontrado nesta ficha.',
        );
      }
      if (dto.quantity > item.quantity) {
        throw new BadRequestException(
          'A quantidade a remover não pode exceder a quantidade atual do item.',
        );
      }

      if (dto.quantity === item.quantity) {
        await itemsRepository.remove(item);
      } else {
        item.quantity -= dto.quantity;
        await itemsRepository.save(item);
      }

      await this.recomputeItemsAndLoadedVolume(sheet, itemsRepository);
      return sheetsRepository.save(sheet);
    });

    const inventory = await this.buildInventoryList(savedSheet.id);
    return { sheet: savedSheet, inventory };
  }

  async increaseInventoryItem(
    id: string,
    itemId: string,
    dto: IncreaseSheetInventoryItemDto,
    currentUser: User,
  ): Promise<SheetInventoryMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const savedSheet = await this.dataSource.transaction(async (manager) => {
      const itemsRepository = manager.getRepository(SheetInventoryItem);
      const sheetsRepository = manager.getRepository(Sheet);

      // Lock pessimista na linha da ficha adquirido antes de qualquer
      // leitura/escrita do `SheetInventoryItem`, na mesma ordem (Sheet →
      // SheetInventoryItem) usada em `addInventoryItem`/`removeInventoryItem`,
      // para não reabrir o risco de deadlock já corrigido nesta feature. Os
      // campos escalares usados por `computeVolumeLimit`/
      // `recomputeItemsAndLoadedVolume` (moedas e melhorias/defeitos) são
      // ressincronizados a partir do valor travado; a entidade `sheet`
      // carregada por `findAccessibleById` mantém suas relações para
      // `SheetResponseDto.fromEntity`.
      const lockedRow = await sheetsRepository.findOne({
        where: { id: sheet.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedRow) {
        throw new NotFoundException(
          'Ficha não encontrada ou não pertence ao usuário.',
        );
      }
      sheet.pc = lockedRow.pc;
      sheet.pp = lockedRow.pp;
      sheet.po = lockedRow.po;
      sheet.pl = lockedRow.pl;
      sheet.melhorias = lockedRow.melhorias;
      sheet.defeitos = lockedRow.defeitos;

      const item = await itemsRepository.findOne({
        where: { id: itemId, sheet: { id: sheet.id } },
      });
      if (!item) {
        throw new NotFoundException(
          'Item de inventário não encontrado nesta ficha.',
        );
      }

      await this.recomputeItemsAndLoadedVolume(sheet, itemsRepository);

      const volumeLimit = this.computeVolumeLimit(sheet);
      const coinsTotal = sheet.pc + sheet.pp + sheet.po + sheet.pl;
      const additionalVolume = this.roundToOneDecimal(
        item.unitVolume * dto.quantity,
      );
      const projectedItemsVolume = this.roundToOneDecimal(
        sheet.itemsVolume + additionalVolume,
      );
      const projectedLoadedVolume =
        Math.floor(coinsTotal / 1000) + projectedItemsVolume;

      if (
        Math.round(projectedLoadedVolume * 10) > Math.round(volumeLimit * 10)
      ) {
        throw new ConflictException(
          'A quantidade solicitada supera o volume limite que a ficha pode carregar.',
        );
      }

      item.quantity += dto.quantity;
      await itemsRepository.save(item);

      await this.recomputeItemsAndLoadedVolume(sheet, itemsRepository);
      return sheetsRepository.save(sheet);
    });

    const inventory = await this.buildInventoryList(savedSheet.id);
    return { sheet: savedSheet, inventory };
  }

  /**
   * Alterna `equipped` de um item de inventário (Arma/Armadura/Acessório/
   * Escudo apenas). Idempotente: `equip` num item já equipado (ou `unequip`
   * num item já desequipado) retorna 200 normalmente, sem efeito colateral.
   */
  private async setInventoryItemEquipped(
    id: string,
    itemId: string,
    currentUser: User,
    equipped: boolean,
  ): Promise<SheetInventoryMutationResult> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }

    const item = await this.sheetInventoryItemsRepository.findOne({
      where: { id: itemId, sheet: { id: sheet.id } },
    });
    if (!item) {
      throw new NotFoundException(
        'Item de inventário não encontrado nesta ficha.',
      );
    }
    if (!EQUIPPABLE_INVENTORY_CATEGORIES.has(item.category)) {
      throw new ConflictException(
        'Apenas itens de Arma, Armadura, Acessório ou Escudo podem ser equipados.',
      );
    }

    if (item.equipped !== equipped) {
      item.equipped = equipped;
      await this.sheetInventoryItemsRepository.save(item);
    }

    const inventory = await this.buildInventoryList(sheet.id);
    return { sheet, inventory };
  }

  async equipInventoryItem(
    id: string,
    itemId: string,
    currentUser: User,
  ): Promise<SheetInventoryMutationResult> {
    return this.setInventoryItemEquipped(id, itemId, currentUser, true);
  }

  async unequipInventoryItem(
    id: string,
    itemId: string,
    currentUser: User,
  ): Promise<SheetInventoryMutationResult> {
    return this.setInventoryItemEquipped(id, itemId, currentUser, false);
  }
}
