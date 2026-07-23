import { ApiProperty } from '@nestjs/swagger';
import { EventListItemResponseDto } from './event-list-item-response.dto';

export class PaginatedEventsResponseDto {
  @ApiProperty({
    type: [EventListItemResponseDto],
    description: 'Lista de eventos da página atual',
  })
  data: EventListItemResponseDto[];

  @ApiProperty({ description: 'Número total de eventos' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página' })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas' })
  totalPages: number;
}
