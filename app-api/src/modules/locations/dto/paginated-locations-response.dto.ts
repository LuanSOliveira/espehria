import { ApiProperty } from '@nestjs/swagger';
import { LocationListItemResponseDto } from './location-list-item-response.dto';

export class PaginatedLocationsResponseDto {
  @ApiProperty({
    type: [LocationListItemResponseDto],
    description: 'Lista de locais da página atual',
  })
  data: LocationListItemResponseDto[];

  @ApiProperty({ description: 'Número total de locais', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
