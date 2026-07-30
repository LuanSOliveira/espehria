import { ApiProperty } from '@nestjs/swagger';
import { UtilityListItemResponseDto } from './utility-list-item-response.dto';

export class PaginatedUtilitiesResponseDto {
  @ApiProperty({
    type: [UtilityListItemResponseDto],
    description: 'Lista de utilitários da página atual',
  })
  data: UtilityListItemResponseDto[];

  @ApiProperty({ description: 'Número total de utilitários', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
