import { ApiProperty } from '@nestjs/swagger';
import { TechniqueListItemResponseDto } from './technique-list-item-response.dto';

export class PaginatedTechniquesResponseDto {
  @ApiProperty({
    type: [TechniqueListItemResponseDto],
    description: 'Lista de técnicas da página atual',
  })
  data: TechniqueListItemResponseDto[];

  @ApiProperty({ description: 'Número total de técnicas', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
