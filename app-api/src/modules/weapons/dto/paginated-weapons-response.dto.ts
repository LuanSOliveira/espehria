import { ApiProperty } from '@nestjs/swagger';
import { WeaponListItemResponseDto } from './weapon-list-item-response.dto';

export class PaginatedWeaponsResponseDto {
  @ApiProperty({
    type: [WeaponListItemResponseDto],
    description: 'Lista de armas da página atual',
  })
  data: WeaponListItemResponseDto[];

  @ApiProperty({ description: 'Número total de armas', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
