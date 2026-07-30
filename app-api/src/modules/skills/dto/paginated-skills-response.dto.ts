import { ApiProperty } from '@nestjs/swagger';
import { SkillListItemResponseDto } from './skill-list-item-response.dto';

export class PaginatedSkillsResponseDto {
  @ApiProperty({
    type: [SkillListItemResponseDto],
    description: 'Lista de perícias da página atual',
  })
  data: SkillListItemResponseDto[];

  @ApiProperty({ description: 'Número total de perícias', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
