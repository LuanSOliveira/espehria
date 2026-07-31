import { ApiProperty } from '@nestjs/swagger';
import { SpellListItemResponseDto } from './spell-list-item-response.dto';

export class PaginatedSpellsResponseDto {
  @ApiProperty({
    type: [SpellListItemResponseDto],
    description: 'Lista de magias da página atual',
  })
  data: SpellListItemResponseDto[];

  @ApiProperty({ description: 'Número total de magias', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
