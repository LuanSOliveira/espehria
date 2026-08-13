import { ApiProperty } from '@nestjs/swagger';
import { TraitListItemResponseDto } from './trait-list-item-response.dto';

export class PaginatedTraitsResponseDto {
  @ApiProperty({
    type: [TraitListItemResponseDto],
    description: 'Lista de traços da página atual',
  })
  data: TraitListItemResponseDto[];

  @ApiProperty({ description: 'Número total de traços', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
