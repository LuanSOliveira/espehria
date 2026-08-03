import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Race } from '../races/entities/race.entity';
import { Biography } from '../biographies/entities/biography.entity';
import { ImprovementFlaw } from '../improvement-flaws/entities/improvement-flaw.entity';
import { ImprovementFlawType } from '../improvement-flaw-types/entities/improvement-flaw-type.entity';
import { ImprovementFlawProperty } from '../improvement-flaw-properties/entities/improvement-flaw-property.entity';
import { Sheet } from './entities/sheet.entity';
import { SheetsController } from './sheets.controller';
import { SheetsService } from './sheets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sheet,
      Campaign,
      Race,
      Biography,
      ImprovementFlaw,
      ImprovementFlawType,
      ImprovementFlawProperty,
    ]),
    CampaignsModule,
  ],
  controllers: [SheetsController],
  providers: [SheetsService],
  exports: [SheetsService],
})
export class SheetsModule {}
