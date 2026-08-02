import {
  BadRequestException,
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
import { Tag } from '../tags/entities/tag.entity';
import { AuthProvider } from '../users/enums/auth-provider.enum';
import { User } from '../users/entities/user.entity';
import { CampaignSectionInputDto } from './dto/campaign-section-input.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { FindCampaignsQueryDto } from './dto/find-campaigns-query.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignSection } from './entities/campaign-section.entity';
import { Campaign } from './entities/campaign.entity';

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
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

  findOwnedById(id: string, userId: string): Promise<Campaign | null> {
    return this.campaignsRepository.findOne({
      where: { id, createdBy: { id: userId } },
      relations: {
        tags: true,
        sections: true,
        createdBy: true,
        allowedUsers: true,
      },
    });
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
    return tags;
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
      tags,
      sections,
      allowedUsers,
      createdBy: currentUser,
    });

    return this.campaignsRepository.save(campaign);
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
      relations: { tags: true },
    });

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
    if (dto.tagIds !== undefined) {
      campaign.tags =
        dto.tagIds.length > 0 ? await this.findTagsByIds(dto.tagIds) : [];
    }
    if (dto.allowedUserIds !== undefined) {
      campaign.allowedUsers =
        dto.allowedUserIds.length > 0
          ? await this.findAllowedUsersByIds(dto.allowedUserIds)
          : [];
    }
    if (dto.sections !== undefined) {
      // Reatribuir `campaign.sections` inteiro e deixar o cascade save cuidar da
      // remoção via orphanedRowAction falha com violação de not-null (mesmo
      // problema e mesma solução usada em LocationsService). Por isso as seções
      // antigas são removidas explicitamente pelo repositório antes de atribuir
      // as novas.
      if (campaign.sections.length > 0) {
        await this.campaignSectionsRepository.remove(campaign.sections);
      }
      campaign.sections =
        dto.sections.length > 0 ? this.buildSections(dto.sections) : [];
    }

    return this.campaignsRepository.save(campaign);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const campaign = await this.findOwnedById(id, currentUser.id);
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }
    await this.campaignsRepository.delete({ id });
  }
}
