import { ApiProperty } from '@nestjs/swagger';
import { BiographyListItemResponseDto } from './biography-list-item-response.dto';

export class PaginatedBiographiesResponseDto {
  @ApiProperty({
    type: [BiographyListItemResponseDto],
    description: 'Lista de biografias da página atual',
  })
  data: BiographyListItemResponseDto[];

  @ApiProperty({ description: 'Número total de biografias', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
