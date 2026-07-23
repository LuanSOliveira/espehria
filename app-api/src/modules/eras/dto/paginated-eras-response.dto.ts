import { ApiProperty } from '@nestjs/swagger';
import { EraListItemResponseDto } from './era-list-item-response.dto';

export class PaginatedErasResponseDto {
  @ApiProperty({
    type: [EraListItemResponseDto],
    description: 'Lista de eras da página atual',
  })
  data: EraListItemResponseDto[];

  @ApiProperty({ description: 'Número total de eras' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página' })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas' })
  totalPages: number;
}
