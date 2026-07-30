import { ApiProperty } from '@nestjs/swagger';
import { MaterialListItemResponseDto } from './material-list-item-response.dto';

export class PaginatedMaterialsResponseDto {
  @ApiProperty({
    type: [MaterialListItemResponseDto],
    description: 'Lista de materiais da página atual',
  })
  data: MaterialListItemResponseDto[];

  @ApiProperty({ description: 'Número total de materiais', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
