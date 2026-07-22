import { ApiProperty } from '@nestjs/swagger';
import { CreatureListItemResponseDto } from './creature-list-item-response.dto';

export class PaginatedCreaturesResponseDto {
  @ApiProperty({
    type: [CreatureListItemResponseDto],
    description: 'Lista de criaturas da página atual',
  })
  data: CreatureListItemResponseDto[];

  @ApiProperty({ description: 'Número total de criaturas' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página' })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas' })
  totalPages: number;
}
