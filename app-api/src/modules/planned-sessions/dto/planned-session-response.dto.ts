import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { PlannedSession } from '../entities/planned-session.entity';
import { PlannedSessionSectionResponseDto } from './planned-session-section-response.dto';

export class PlannedSessionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da sessão planejada',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da sessão planejada',
    example: 'Sessão 1 — A Chegada a Valgrim',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Introdução da sessão planejada (HTML)',
  })
  introduction: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à sessão planejada, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [PlannedSessionSectionResponseDto],
    description: 'Seções da sessão planejada',
  })
  sections: PlannedSessionSectionResponseDto[];

  @ApiProperty({
    format: 'uuid',
    description:
      'Identificador da campanha-pai. Campo somente leitura, herdado da rota',
  })
  campaignId: string;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(plannedSession: PlannedSession): PlannedSessionResponseDto {
    const dto = new PlannedSessionResponseDto();
    dto.id = plannedSession.id;
    dto.name = plannedSession.name;
    dto.introduction = plannedSession.introduction;
    dto.tags = (plannedSession.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.sections = (plannedSession.sections ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => PlannedSessionSectionResponseDto.fromEntity(section));
    dto.campaignId = plannedSession.campaign.id;
    dto.createdAt = plannedSession.createdAt;
    dto.updatedAt = plannedSession.updatedAt;
    return dto;
  }
}
