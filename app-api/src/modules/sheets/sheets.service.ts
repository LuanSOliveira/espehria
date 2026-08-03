import {
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
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Race } from '../races/entities/race.entity';
import { Biography } from '../biographies/entities/biography.entity';
import { ImprovementFlaw } from '../improvement-flaws/entities/improvement-flaw.entity';
import { ImprovementFlawType } from '../improvement-flaw-types/entities/improvement-flaw-type.entity';
import { ImprovementFlawProperty } from '../improvement-flaw-properties/entities/improvement-flaw-property.entity';
import { ImprovementFlawCategory } from '../improvement-flaws/enums/improvement-flaw-category.enum';
import { AuthProvider } from '../users/enums/auth-provider.enum';
import { User } from '../users/entities/user.entity';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { FindSheetsQueryDto } from './dto/find-sheets-query.dto';
import { LinkSheetBiographyDto } from './dto/link-sheet-biography.dto';
import { LinkSheetRaceDto } from './dto/link-sheet-race.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { Sheet } from './entities/sheet.entity';
import { SheetImprovementFlawSnapshotEntry } from './interfaces/sheet-improvement-flaw-snapshot.interface';

const ATTRIBUTE_TYPE_NAME = 'Atributo';
const FREE_IMPROVEMENT_VALUE = 2;

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
    @InjectRepository(Biography)
    private readonly biographiesRepository: Repository<Biography>,
    @InjectRepository(ImprovementFlaw)
    private readonly improvementFlawsRepository: Repository<ImprovementFlaw>,
    @InjectRepository(ImprovementFlawType)
    private readonly improvementFlawTypesRepository: Repository<ImprovementFlawType>,
    @InjectRepository(ImprovementFlawProperty)
    private readonly improvementFlawPropertiesRepository: Repository<ImprovementFlawProperty>,
  ) {}

  private async findCampaignById(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOneBy({ id });
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }
    return campaign;
  }

  private async findRaceById(id: string): Promise<Race> {
    const race = await this.racesRepository.findOne({
      where: { id },
      relations: {
        category: true,
        tags: true,
        characteristics: { tags: true },
        talents: { tags: true },
      },
    });
    if (!race) {
      throw new NotFoundException('Raça não encontrada.');
    }
    return race;
  }

  private isRestrictedToOwnSheets(currentUser: User): boolean {
    return currentUser.provider === AuthProvider.GOOGLE;
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
          tags: true,
          characteristics: { tags: true },
          talents: { tags: true },
        },
        biography: { tags: true },
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

    const biography = await this.biographiesRepository.findOne({
      where: { id: dto.biographyId },
      relations: { tags: true },
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
    ];

    sheet.biography = biography;
    sheet.melhorias = { ...sheet.melhorias, biography: biographyImprovements };
    sheet.defeitos = { ...sheet.defeitos, biography: [] };

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
