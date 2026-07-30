import { ApiProperty } from '@nestjs/swagger';
import { ConditionListItemResponseDto } from './condition-list-item-response.dto';

export class PaginatedConditionsResponseDto {
  @ApiProperty({
    type: [ConditionListItemResponseDto],
    description: 'Lista de condições da página atual',
  })
  data: ConditionListItemResponseDto[];

  @ApiProperty({ description: 'Número total de condições', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
