import { ApiProperty } from '@nestjs/swagger';
import { EnhancementListItemResponseDto } from './enhancement-list-item-response.dto';

export class PaginatedEnhancementsResponseDto {
  @ApiProperty({
    type: [EnhancementListItemResponseDto],
    description: 'Lista de aprimoramentos da página atual',
  })
  data: EnhancementListItemResponseDto[];

  @ApiProperty({ description: 'Número total de aprimoramentos', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
