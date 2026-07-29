import { ApiProperty } from '@nestjs/swagger';
import { FamilyListItemResponseDto } from './family-list-item-response.dto';

export class PaginatedFamiliesResponseDto {
  @ApiProperty({
    type: [FamilyListItemResponseDto],
    description: 'Lista de famílias da página atual',
  })
  data: FamilyListItemResponseDto[];

  @ApiProperty({ description: 'Número total de famílias', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
