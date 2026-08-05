import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { FindOptionsWhere, In, Not, Repository } from 'typeorm';
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
import { CharacteristicTag } from '../characteristics/entities/characteristic-tag.entity';
import { TalentTag } from '../talents/entities/talent-tag.entity';
import { Biography } from '../biographies/entities/biography.entity';
import { BiographyTag } from '../biographies/entities/biography-tag.entity';
import { ImprovementFlaw } from '../improvement-flaws/entities/improvement-flaw.entity';
import { ImprovementFlawType } from '../improvement-flaw-types/entities/improvement-flaw-type.entity';
import { ImprovementFlawProperty } from '../improvement-flaw-properties/entities/improvement-flaw-property.entity';
import { ImprovementFlawCategory } from '../improvement-flaws/enums/improvement-flaw-category.enum';
import { Proficiency } from '../proficiencies/entities/proficiency.entity';
import { ProficiencyProperty } from '../proficiency-properties/entities/proficiency-property.entity';
import { AuthProvider } from '../users/enums/auth-provider.enum';
import { User } from '../users/entities/user.entity';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { FindSheetsQueryDto } from './dto/find-sheets-query.dto';
import { LinkSheetBiographyDto } from './dto/link-sheet-biography.dto';
import { LinkSheetRaceDto } from './dto/link-sheet-race.dto';
import { ResolveProficiencyAdjustmentDto } from './dto/resolve-proficiency-adjustment.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { Sheet } from './entities/sheet.entity';
import { SheetImprovementFlawSnapshotEntry } from './interfaces/sheet-improvement-flaw-snapshot.interface';
import {
  SheetProficiencySnapshot,
  SheetProficiencySnapshotEntry,
} from './interfaces/sheet-proficiency-snapshot.interface';
import {
  SheetProficiencyAdjustment,
  SheetProficiencyAdjustmentSourceType,
} from './interfaces/sheet-proficiency-adjustment.interface';

const ATTRIBUTE_TYPE_NAME = 'Atributo';
const FREE_IMPROVEMENT_VALUE = 2;

interface ProficiencySource {
  type: Extract<SheetProficiencyAdjustmentSourceType, 'race' | 'biography'>;
  id: string;
  name: string;
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
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    @InjectRepository(Race)
    private readonly racesRepository: Repository<Race>,
    @InjectRepository(RaceTag)
    private readonly raceTagsRepository: Repository<RaceTag>,
    @InjectRepository(CharacteristicTag)
    private readonly characteristicTagsRepository: Repository<CharacteristicTag>,
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
  ) {}

  private async findCampaignById(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOneBy({ id });
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }
    return campaign;
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
      characteristic.tags =
        characteristicTagsById.get(characteristic.id) ?? [];
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
      const ownerColumn: string =
        source.type === 'race' ? 'ownerRace' : 'ownerBiography';
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
      proficiencias[sourceType].push(entry);
    }

    sheet.proficiencias = proficiencias;
    sheet.proficienciasAjustadas = adjustments;
  }

  async create(dto: CreateSheetDto, currentUser: User): Promise<Sheet> {
    const campaign = dto.campaignId
      ? await this.findCampaignById(dto.campaignId)
      : null;

    const sheet = this.sheetsRepository.create({
      name: dto.name,
      referenceImage: dto.referenceImage ?? null,
      level: 1,
      campaign,
      race: null,
      createdBy: currentUser,
    });

    return this.sheetsRepository.save(sheet);
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

    if (dto.name !== undefined) {
      sheet.name = dto.name;
    }
    if (dto.referenceImage !== undefined) {
      sheet.referenceImage = dto.referenceImage;
    }
    if (dto.level !== undefined) {
      sheet.level = dto.level;
    }
    if (dto.campaignId !== undefined) {
      sheet.campaign = dto.campaignId
        ? await this.findCampaignById(dto.campaignId)
        : null;
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

    const proficiencySources: ProficiencySource[] = [];
    if (sheet.biography) {
      proficiencySources.push({
        type: 'biography',
        id: sheet.biography.id,
        name: sheet.biography.name,
      });
    }
    proficiencySources.push({ type: 'race', id: race.id, name: race.name });
    await this.recomputeProficiencies(sheet, proficiencySources);

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

    const proficiencySources: ProficiencySource[] = sheet.biography
      ? [
          {
            type: 'biography',
            id: sheet.biography.id,
            name: sheet.biography.name,
          },
        ]
      : [];
    await this.recomputeProficiencies(sheet, proficiencySources);

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

    const proficiencySources: ProficiencySource[] = [];
    if (sheet.race) {
      proficiencySources.push({
        type: 'race',
        id: sheet.race.id,
        name: sheet.race.name,
      });
    }
    proficiencySources.push({
      type: 'biography',
      id: biography.id,
      name: biography.name,
    });
    await this.recomputeProficiencies(sheet, proficiencySources);

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

    const proficiencySources: ProficiencySource[] = sheet.race
      ? [{ type: 'race', id: sheet.race.id, name: sheet.race.name }]
      : [];
    await this.recomputeProficiencies(sheet, proficiencySources);

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

  async remove(id: string, currentUser: User): Promise<void> {
    const sheet = await this.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }
    await this.sheetsRepository.delete({ id });
  }
}
