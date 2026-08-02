import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Race } from '../races/entities/race.entity';
import { AuthProvider } from '../users/enums/auth-provider.enum';
import { User } from '../users/entities/user.entity';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { FindSheetsQueryDto } from './dto/find-sheets-query.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { Sheet } from './entities/sheet.entity';

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
    if (dto.raceId !== undefined) {
      sheet.race = dto.raceId ? await this.findRaceById(dto.raceId) : null;
    }

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
