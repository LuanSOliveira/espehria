import { ApiProperty } from '@nestjs/swagger';
import { ArmorListItemResponseDto } from './armor-list-item-response.dto';

export class PaginatedArmorsResponseDto {
  @ApiProperty({
    type: [ArmorListItemResponseDto],
    description: 'Lista de armaduras da página atual',
  })
  data: ArmorListItemResponseDto[];

  @ApiProperty({ description: 'Número total de armaduras', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
