import { ApiProperty } from '@nestjs/swagger';
import { CharacteristicListItemResponseDto } from './characteristic-list-item-response.dto';

export class PaginatedCharacteristicsResponseDto {
  @ApiProperty({
    type: [CharacteristicListItemResponseDto],
    description: 'Lista de características da página atual',
  })
  data: CharacteristicListItemResponseDto[];

  @ApiProperty({ description: 'Número total de características', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
