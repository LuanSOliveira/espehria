import { ApiProperty } from '@nestjs/swagger';
import { DivinityListItemResponseDto } from './divinity-list-item-response.dto';

export class PaginatedDivinitiesResponseDto {
  @ApiProperty({
    type: [DivinityListItemResponseDto],
    description: 'Lista de divindades da página atual',
  })
  data: DivinityListItemResponseDto[];

  @ApiProperty({ description: 'Número total de divindades' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página' })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas' })
  totalPages: number;
}
