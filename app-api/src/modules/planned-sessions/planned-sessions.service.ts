import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { CampaignsService } from '../campaigns/campaigns.service';
import { Tag } from '../tags/entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { CreatePlannedSessionDto } from './dto/create-planned-session.dto';
import { FindPlannedSessionsQueryDto } from './dto/find-planned-sessions-query.dto';
import { PlannedSessionSectionInputDto } from './dto/planned-session-section-input.dto';
import { UpdatePlannedSessionDto } from './dto/update-planned-session.dto';
import { PlannedSessionSection } from './entities/planned-session-section.entity';
import { PlannedSession } from './entities/planned-session.entity';

export interface PaginatedPlannedSessions {
  data: PlannedSession[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class PlannedSessionsService {
  constructor(
    @InjectRepository(PlannedSession)
    private readonly plannedSessionsRepository: Repository<PlannedSession>,
    @InjectRepository(PlannedSessionSection)
    private readonly plannedSessionSectionsRepository: Repository<PlannedSessionSection>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly campaignsService: CampaignsService,
  ) {}

  private async ensureOwnedCampaign(
    campaignId: string,
    userId: string,
  ): Promise<void> {
    const campaign = await this.campaignsService.findOwnedById(
      campaignId,
      userId,
    );
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }
  }

  findOwnedById(
    id: string,
    campaignId: string,
  ): Promise<PlannedSession | null> {
    return this.plannedSessionsRepository.findOne({
      where: { id, campaign: { id: campaignId } },
      relations: { tags: true, sections: true, campaign: true },
    });
  }

  async findOneOwned(
    campaignId: string,
    id: string,
    currentUser: User,
  ): Promise<PlannedSession> {
    await this.ensureOwnedCampaign(campaignId, currentUser.id);

    const plannedSession = await this.findOwnedById(id, campaignId);
    if (!plannedSession) {
      throw new NotFoundException('Sessão planejada não encontrada.');
    }
    return plannedSession;
  }

  private buildSections(
    sections: PlannedSessionSectionInputDto[],
  ): PlannedSessionSection[] {
    return sections.map((section, index) =>
      this.plannedSessionSectionsRepository.create({
        label: section.label,
        description: section.description ?? null,
        order: index,
      }),
    );
  }

  private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.tagsRepository.findBy({ id: In(uniqueIds) });
    if (tags.length !== uniqueIds.length) {
      throw new NotFoundException('Uma ou mais tags não foram encontradas.');
    }
    return tags;
  }

  async create(
    campaignId: string,
    dto: CreatePlannedSessionDto,
    currentUser: User,
  ): Promise<PlannedSession> {
    await this.ensureOwnedCampaign(campaignId, currentUser.id);

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const sections =
      dto.sections && dto.sections.length > 0
        ? this.buildSections(dto.sections)
        : [];

    const plannedSession = this.plannedSessionsRepository.create({
      name: dto.name,
      introduction: dto.introduction ?? null,
      tags,
      sections,
      campaign: { id: campaignId } as Campaign,
    });

    return this.plannedSessionsRepository.save(plannedSession);
  }

  async findAllPaginated(
    campaignId: string,
    query: FindPlannedSessionsQueryDto,
    currentUser: User,
  ): Promise<PaginatedPlannedSessions> {
    await this.ensureOwnedCampaign(campaignId, currentUser.id);

    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.plannedSessionsRepository
      .createQueryBuilder('plannedSession')
      .andWhere('plannedSession.campaign = :campaignId', { campaignId });

    if (query.name) {
      queryBuilder.andWhere('plannedSession.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['plannedSession.id', 'plannedSession.name'])
      .orderBy('plannedSession.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const plannedSessions = await this.plannedSessionsRepository.find({
      where: { id: In(ids.map((session) => session.id)) },
      relations: { tags: true },
    });

    const plannedSessionsById = new Map(
      plannedSessions.map((session) => [session.id, session]),
    );
    const data = ids
      .map((session) => plannedSessionsById.get(session.id))
      .filter((session): session is PlannedSession => session !== undefined);

    return { data, total, page, perPage };
  }

  async update(
    campaignId: string,
    id: string,
    dto: UpdatePlannedSessionDto,
    currentUser: User,
  ): Promise<PlannedSession> {
    const plannedSession = await this.findOneOwned(campaignId, id, currentUser);

    if (dto.name !== undefined) {
      plannedSession.name = dto.name;
    }
    if (dto.introduction !== undefined) {
      plannedSession.introduction = dto.introduction;
    }
    if (dto.tagIds !== undefined) {
      plannedSession.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }
    if (dto.sections !== undefined) {
      // Mesmo cuidado de LocationsService/CampaignsService: remover as seções
      // antigas explicitamente antes de atribuir as novas evita violação de
      // not-null que o cascade save causaria ao tentar apenas desvincular.
      if (plannedSession.sections.length > 0) {
        await this.plannedSessionSectionsRepository.remove(
          plannedSession.sections,
        );
      }
      plannedSession.sections =
        dto.sections.length > 0 ? this.buildSections(dto.sections) : [];
    }

    return this.plannedSessionsRepository.save(plannedSession);
  }

  async remove(
    campaignId: string,
    id: string,
    currentUser: User,
  ): Promise<void> {
    const plannedSession = await this.findOneOwned(campaignId, id, currentUser);
    await this.plannedSessionsRepository.delete({ id: plannedSession.id });
  }
}
