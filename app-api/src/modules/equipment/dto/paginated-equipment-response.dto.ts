import { ApiProperty } from '@nestjs/swagger';
import { EquipmentListItemResponseDto } from './equipment-list-item-response.dto';

export class PaginatedEquipmentResponseDto {
  @ApiProperty({
    type: [EquipmentListItemResponseDto],
    description: 'Lista de equipamentos da página atual',
  })
  data: EquipmentListItemResponseDto[];

  @ApiProperty({ description: 'Número total de equipamentos', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
