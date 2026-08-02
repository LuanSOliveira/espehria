import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sheet } from '../sheets/entities/sheet.entity';
import { Tag } from '../tags/entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignSection } from './entities/campaign-section.entity';
import { Campaign } from './entities/campaign.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignSection, Tag, User, Sheet]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
