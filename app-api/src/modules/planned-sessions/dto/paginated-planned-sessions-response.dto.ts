import { ApiProperty } from '@nestjs/swagger';
import { PlannedSessionListItemResponseDto } from './planned-session-list-item-response.dto';

export class PaginatedPlannedSessionsResponseDto {
  @ApiProperty({
    type: [PlannedSessionListItemResponseDto],
    description: 'Lista de sessões planejadas da página atual',
  })
  data: PlannedSessionListItemResponseDto[];

  @ApiProperty({
    description: 'Número total de sessões planejadas',
    example: 42,
  })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
