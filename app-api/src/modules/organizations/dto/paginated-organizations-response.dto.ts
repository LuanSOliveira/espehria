import { ApiProperty } from '@nestjs/swagger';
import { OrganizationListItemResponseDto } from './organization-list-item-response.dto';

export class PaginatedOrganizationsResponseDto {
  @ApiProperty({
    type: [OrganizationListItemResponseDto],
    description: 'Lista de organizações da página atual',
  })
  data: OrganizationListItemResponseDto[];

  @ApiProperty({ description: 'Número total de organizações', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
