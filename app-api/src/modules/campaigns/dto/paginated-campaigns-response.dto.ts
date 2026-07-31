import { ApiProperty } from '@nestjs/swagger';
import { CampaignListItemResponseDto } from './campaign-list-item-response.dto';

export class PaginatedCampaignsResponseDto {
  @ApiProperty({
    type: [CampaignListItemResponseDto],
    description: 'Lista de campanhas da página atual',
  })
  data: CampaignListItemResponseDto[];

  @ApiProperty({ description: 'Número total de campanhas', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
