import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsModule } from '../campaigns/campaigns.module';
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
import { Proficiency } from '../proficiencies/entities/proficiency.entity';
import { ProficiencyProperty } from '../proficiency-properties/entities/proficiency-property.entity';
import { ProficiencyGradation } from '../proficiency-gradations/entities/proficiency-gradation.entity';
import { Knowledge } from '../knowledges/entities/knowledge.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { EntityLinksModule } from '../entity-links/entity-links.module';
import { Sheet } from './entities/sheet.entity';
import { SheetTrainingSlot } from './entities/sheet-training-slot.entity';
import { SheetAbilityExtra } from './entities/sheet-ability-extra.entity';
import { SheetsController } from './sheets.controller';
import { SheetsService } from './sheets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sheet,
      SheetTrainingSlot,
      SheetAbilityExtra,
      Campaign,
      Race,
      RaceTag,
      Characteristic,
      CharacteristicTag,
      Training,
      TrainingTag,
      Talent,
      TalentTag,
      Biography,
      BiographyTag,
      ImprovementFlaw,
      ImprovementFlawType,
      ImprovementFlawProperty,
      Proficiency,
      ProficiencyProperty,
      ProficiencyGradation,
      Knowledge,
      Attribute,
    ]),
    CampaignsModule,
    EntityLinksModule,
  ],
  controllers: [SheetsController],
  providers: [SheetsService],
  exports: [SheetsService],
})
export class SheetsModule {}
