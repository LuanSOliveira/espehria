import { ApiProperty } from '@nestjs/swagger';
import { RuleListItemResponseDto } from './rule-list-item-response.dto';

export class PaginatedRulesResponseDto {
  @ApiProperty({
    type: [RuleListItemResponseDto],
    description: 'Lista de regras da página atual',
  })
  data: RuleListItemResponseDto[];

  @ApiProperty({ description: 'Número total de regras', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
