import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
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
import { Sheet } from '../sheets/entities/sheet.entity';
import { Tag } from '../tags/entities/tag.entity';
import { AuthProvider } from '../users/enums/auth-provider.enum';
import { User } from '../users/entities/user.entity';
import { CampaignSectionInputDto } from './dto/campaign-section-input.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { FindCampaignsQueryDto } from './dto/find-campaigns-query.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignSection } from './entities/campaign-section.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignTag } from './entities/campaign-tag.entity';

export interface PaginatedCampaigns {
  data: Campaign[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    @InjectRepository(CampaignSection)
    private readonly campaignSectionsRepository: Repository<CampaignSection>,
    @InjectRepository(CampaignTag)
    private readonly campaignTagsRepository: Repository<CampaignTag>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Sheet)
    private readonly sheetsRepository: Repository<Sheet>,
    private readonly dataSource: DataSource,
  ) {}

  private findByNameForUser(
    name: string,
    userId: string,
  ): Promise<Campaign | null> {
    return this.campaignsRepository.findOneBy({
      name,
      createdBy: { id: userId },
    });
  }

  async findOwnedById(id: string, userId: string): Promise<Campaign | null> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id, createdBy: { id: userId } },
      relations: {
        sections: true,
        createdBy: true,
        allowedUsers: true,
      },
    });
    if (!campaign) {
      return null;
    }
    campaign.tags = await loadOrderedTagsForOwner(
      this.campaignTagsRepository,
      id,
      'campaign',
    );
    return campaign;
  }

  async findVisibleForUser(currentUser: User): Promise<Campaign[]> {
    if (currentUser.provider === AuthProvider.GOOGLE) {
      return this.campaignsRepository
        .createQueryBuilder('campaign')
        .innerJoin('campaign.allowedUsers', 'allowedUser')
        .where('allowedUser.id = :userId', { userId: currentUser.id })
        .orderBy('campaign.name', 'ASC')
        .getMany();
    }

    return this.campaignsRepository.find({ order: { name: 'ASC' } });
  }

  private buildSections(
    sections: CampaignSectionInputDto[],
  ): CampaignSection[] {
    return sections.map((section, index) =>
      this.campaignSectionsRepository.create({
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

  private async findAllowedUsersByIds(userIds: string[]): Promise<User[]> {
    const uniqueIds = [...new Set(userIds)];
    const users = await this.usersRepository.findBy({ id: In(uniqueIds) });
    if (
      users.length !== uniqueIds.length ||
      users.some((user) => user.provider !== AuthProvider.GOOGLE)
    ) {
      throw new BadRequestException(
        'Um ou mais usuários informados não são usuários Google válidos.',
      );
    }
    return users;
  }

  async create(dto: CreateCampaignDto, currentUser: User): Promise<Campaign> {
    const existing = await this.findByNameForUser(dto.name, currentUser.id);
    if (existing) {
      throw new ConflictException('Já existe uma campanha com este nome.');
    }

    const tags =
      dto.tagIds && dto.tagIds.length > 0
        ? await this.findTagsByIds(dto.tagIds)
        : [];

    const sections =
      dto.sections && dto.sections.length > 0
        ? this.buildSections(dto.sections)
        : [];

    const allowedUsers =
      dto.allowedUserIds && dto.allowedUserIds.length > 0
        ? await this.findAllowedUsersByIds(dto.allowedUserIds)
        : [];

    const campaign = this.campaignsRepository.create({
      name: dto.name,
      referenceImageUrl: dto.referenceImageUrl ?? null,
      description: dto.description ?? null,
      sections,
      allowedUsers,
      createdBy: currentUser,
    });

    const savedCampaign = await this.campaignsRepository.save(campaign);
    await createOrderedTagJunctions(
      this.campaignTagsRepository,
      'campaign',
      savedCampaign,
      tags,
    );
    savedCampaign.tags = tags;
    return savedCampaign;
  }

  async findAllPaginated(
    query: FindCampaignsQueryDto,
    currentUser: User,
  ): Promise<PaginatedCampaigns> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.campaignsRepository
      .createQueryBuilder('campaign')
      .andWhere('campaign.createdBy = :userId', { userId: currentUser.id });

    if (query.name) {
      queryBuilder.andWhere('campaign.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [ids, total] = await queryBuilder
      .select(['campaign.id', 'campaign.name'])
      .orderBy('campaign.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (ids.length === 0) {
      return { data: [], total, page, perPage };
    }

    const campaigns = await this.campaignsRepository.find({
      where: { id: In(ids.map((campaign) => campaign.id)) },
    });

    const tagsByCampaignId = await loadOrderedTagsMap(
      this.campaignTagsRepository,
      campaigns.map((campaign) => campaign.id),
      'campaign',
    );
    for (const campaign of campaigns) {
      campaign.tags = tagsByCampaignId.get(campaign.id) ?? [];
    }

    const campaignsById = new Map(
      campaigns.map((campaign) => [campaign.id, campaign]),
    );
    const data = ids
      .map((campaign) => campaignsById.get(campaign.id))
      .filter((campaign): campaign is Campaign => campaign !== undefined);

    return { data, total, page, perPage };
  }

  async update(
    id: string,
    dto: UpdateCampaignDto,
    currentUser: User,
  ): Promise<Campaign> {
    const campaign = await this.findOwnedById(id, currentUser.id);
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    if (dto.name && dto.name !== campaign.name) {
      const existing = await this.findByNameForUser(dto.name, currentUser.id);
      if (existing) {
        throw new ConflictException('Já existe uma campanha com este nome.');
      }
      campaign.name = dto.name;
    }

    if (dto.referenceImageUrl !== undefined) {
      campaign.referenceImageUrl = dto.referenceImageUrl;
    }
    if (dto.description !== undefined) {
      campaign.description = dto.description;
    }
    let tags = campaign.tags;
    if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }

    let removedUserIds: string[] = [];
    if (dto.allowedUserIds !== undefined) {
      const allowedUserIds = dto.allowedUserIds;
      removedUserIds = campaign.allowedUsers
        .filter((user) => !allowedUserIds.includes(user.id))
        .map((user) => user.id);
      campaign.allowedUsers =
        allowedUserIds.length > 0
          ? await this.findAllowedUsersByIds(allowedUserIds)
          : [];
    }

    const newSections =
      dto.sections !== undefined
        ? dto.sections.length > 0
          ? this.buildSections(dto.sections)
          : []
        : undefined;

    return this.dataSource.transaction(async (manager) => {
      const campaignsRepository = manager.getRepository(Campaign);
      const campaignSectionsRepository = manager.getRepository(CampaignSection);
      const campaignTagsRepository = manager.getRepository(CampaignTag);

      if (dto.tagIds !== undefined) {
        await replaceOrderedTagJunctions(
          campaignTagsRepository,
          'campaign',
          campaign,
          tags,
        );
      }

      if (newSections !== undefined) {
        // Reatribuir `campaign.sections` inteiro e deixar o cascade save cuidar da
        // remoção via orphanedRowAction falha com violação de not-null (mesmo
        // problema e mesma solução usada em LocationsService). Por isso as seções
        // antigas são removidas explicitamente pelo repositório antes de atribuir
        // as novas.
        if (campaign.sections.length > 0) {
          await campaignSectionsRepository.remove(campaign.sections);
        }
        campaign.sections = newSections;
      }

      const savedCampaign = await campaignsRepository.save(campaign);
      savedCampaign.tags = tags;

      if (removedUserIds.length > 0) {
        await this.unassignSheetsOfRemovedAllowedUsers(
          manager,
          savedCampaign.id,
          removedUserIds,
        );
      }

      return savedCampaign;
    });
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const campaign = await this.findOwnedById(id, currentUser.id);
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }
    await this.campaignsRepository.delete({ id });
  }

  private async unassignSheetsOfRemovedAllowedUsers(
    manager: EntityManager,
    campaignId: string,
    removedUserIds: string[],
  ): Promise<void> {
    if (removedUserIds.length === 0) {
      return;
    }
    await manager
      .createQueryBuilder()
      .update(Sheet)
      .set({ campaign: null })
      .where('campaign_id = :campaignId', { campaignId })
      .andWhere('created_by_id IN (:...removedUserIds)', { removedUserIds })
      .execute();
  }

  async removeAllowedUser(
    campaignId: string,
    userId: string,
    currentUser: User,
  ): Promise<Campaign> {
    const campaign = await this.findOwnedById(campaignId, currentUser.id);
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    const isAllowedUser = campaign.allowedUsers.some(
      (user) => user.id === userId,
    );
    if (!isAllowedUser) {
      throw new NotFoundException(
        'Usuário não está na lista de usuários permitidos desta campanha.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .relation(Campaign, 'allowedUsers')
        .of(campaignId)
        .remove(userId);
      await this.unassignSheetsOfRemovedAllowedUsers(manager, campaignId, [
        userId,
      ]);
    });

    const updatedCampaign = await this.findOwnedById(
      campaignId,
      currentUser.id,
    );
    if (!updatedCampaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }
    return updatedCampaign;
  }

  async findSheetsOfCampaign(
    campaignId: string,
    currentUser: User,
  ): Promise<Sheet[]> {
    const campaign = await this.findOwnedById(campaignId, currentUser.id);
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    return this.sheetsRepository.find({
      where: { campaign: { id: campaignId } },
      relations: { createdBy: true },
      order: { name: 'ASC' },
    });
  }

  async unassignSheet(
    campaignId: string,
    sheetId: string,
    currentUser: User,
  ): Promise<void> {
    const campaign = await this.findOwnedById(campaignId, currentUser.id);
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId },
      relations: { campaign: true },
    });
    if (!sheet || sheet.campaign?.id !== campaignId) {
      throw new NotFoundException(
        'Ficha não encontrada ou não vinculada a esta campanha.',
      );
    }

    sheet.campaign = null;
    await this.sheetsRepository.save(sheet);
  }
}
