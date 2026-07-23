import { ApiProperty } from '@nestjs/swagger';
import { RaceListItemResponseDto } from './race-list-item-response.dto';

export class PaginatedRacesResponseDto {
  @ApiProperty({
    type: [RaceListItemResponseDto],
    description: 'Lista de raças da página atual',
  })
  data: RaceListItemResponseDto[];

  @ApiProperty({ description: 'Número total de raças' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página' })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas' })
  totalPages: number;
}
