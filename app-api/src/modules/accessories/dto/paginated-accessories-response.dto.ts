import { ApiProperty } from '@nestjs/swagger';
import { AccessoryListItemResponseDto } from './accessory-list-item-response.dto';

export class PaginatedAccessoriesResponseDto {
  @ApiProperty({
    type: [AccessoryListItemResponseDto],
    description: 'Lista de acessórios da página atual',
  })
  data: AccessoryListItemResponseDto[];

  @ApiProperty({ description: 'Número total de acessórios', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
