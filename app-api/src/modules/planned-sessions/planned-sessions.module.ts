import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { Tag } from '../tags/entities/tag.entity';
import { PlannedSessionSection } from './entities/planned-session-section.entity';
import { PlannedSession } from './entities/planned-session.entity';
import { PlannedSessionTag } from './entities/planned-session-tag.entity';
import { PlannedSessionsController } from './planned-sessions.controller';
import { PlannedSessionsService } from './planned-sessions.service';

@Module({
  imports: [
    CampaignsModule,
    TypeOrmModule.forFeature([
      PlannedSession,
      PlannedSessionSection,
      PlannedSessionTag,
      Tag,
    ]),
  ],
  controllers: [PlannedSessionsController],
  providers: [PlannedSessionsService],
})
export class PlannedSessionsModule {}
