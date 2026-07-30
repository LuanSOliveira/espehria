import { ApiProperty } from '@nestjs/swagger';
import { AmmunitionListItemResponseDto } from './ammunition-list-item-response.dto';

export class PaginatedAmmunitionResponseDto {
  @ApiProperty({
    type: [AmmunitionListItemResponseDto],
    description: 'Lista de itens de munição da página atual',
  })
  data: AmmunitionListItemResponseDto[];

  @ApiProperty({
    description: 'Número total de itens de munição',
    example: 42,
  })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
