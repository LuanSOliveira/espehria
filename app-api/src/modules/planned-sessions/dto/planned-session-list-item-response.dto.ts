import { ApiProperty } from '@nestjs/swagger';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { PlannedSession } from '../entities/planned-session.entity';

export class PlannedSessionListItemResponseDto {
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

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à sessão planejada',
  })
  tags: TagResponseDto[];

  static fromEntity(
    plannedSession: PlannedSession,
  ): PlannedSessionListItemResponseDto {
    const dto = new PlannedSessionListItemResponseDto();
    dto.id = plannedSession.id;
    dto.name = plannedSession.name;
    dto.tags = (plannedSession.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
