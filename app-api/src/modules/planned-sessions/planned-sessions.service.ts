import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
import { PlannedSessionTag } from './entities/planned-session-tag.entity';

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
    @InjectRepository(PlannedSessionTag)
    private readonly plannedSessionTagsRepository: Repository<PlannedSessionTag>,
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

  async findOwnedById(
    id: string,
    campaignId: string,
  ): Promise<PlannedSession | null> {
    const plannedSession = await this.plannedSessionsRepository.findOne({
      where: { id, campaign: { id: campaignId } },
      relations: { sections: true, campaign: true },
    });
    if (!plannedSession) {
      return null;
    }
    plannedSession.tags = await loadOrderedTagsForOwner(
      this.plannedSessionTagsRepository,
      id,
      'plannedSession',
    );
    return plannedSession;
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
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    return uniqueIds.map((id) => tagsById.get(id)!);
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
      sections,
      campaign: { id: campaignId } as Campaign,
    });

    const savedPlannedSession =
      await this.plannedSessionsRepository.save(plannedSession);
    await createOrderedTagJunctions(
      this.plannedSessionTagsRepository,
      'plannedSession',
      savedPlannedSession,
      tags,
    );
    savedPlannedSession.tags = tags;
    return savedPlannedSession;
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

    const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;
    if (hasTagFilter) {
      const uniqueTagIds = [...new Set(query.tagIds)];
      queryBuilder
        .innerJoin(
          'planned_session_tags',
          'planned_session_tag_filter',
          'planned_session_tag_filter.planned_session_id = plannedSession.id AND planned_session_tag_filter.tag_id IN (:...tagIds)',
          { tagIds: uniqueTagIds },
        )
        .groupBy('plannedSession.id')
        .having(
          'COUNT(DISTINCT planned_session_tag_filter.tag_id) = :tagCount',
          { tagCount: uniqueTagIds.length },
        );
    }

    // `getManyAndCount()` não computa corretamente o total quando a query tem
    // `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento).
    // Por isso, apenas quando há filtro de tags (e, portanto, `groupBy`/
    // `having` aplicados), o total é calculado separadamente a partir de uma
    // cópia da query já filtrada/agrupada (que mantém o `andWhere` de
    // `campaignId`), contando as linhas resultantes (uma por sessão
    // planejada). Sem filtro de tags, `getCount()` é suficiente e evita
    // trazer todos os ids para a aplicação só para contá-los.
    const total = hasTagFilter
      ? (await queryBuilder.clone().select('plannedSession.id').getRawMany())
          .length
      : await queryBuilder.clone().getCount();

    const ids = await queryBuilder
      .select(['plannedSession.id', 'plannedSession.name'])
      .orderBy('plannedSession.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const plannedSessions = await this.plannedSessionsRepository.find({
      where: { id: In(ids.map((session) => session.id)) },
    });

    const tagsByPlannedSessionId = await loadOrderedTagsMap(
      this.plannedSessionTagsRepository,
      plannedSessions.map((session) => session.id),
      'plannedSession',
    );
    for (const session of plannedSessions) {
      session.tags = tagsByPlannedSessionId.get(session.id) ?? [];
    }

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
    let tags = plannedSession.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
      await replaceOrderedTagJunctions(
        this.plannedSessionTagsRepository,
        'plannedSession',
        plannedSession,
        tags,
      );
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

    const savedPlannedSession =
      await this.plannedSessionsRepository.save(plannedSession);
    savedPlannedSession.tags = tags;
    return savedPlannedSession;
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
