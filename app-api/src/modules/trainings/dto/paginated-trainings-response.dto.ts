import { ApiProperty } from '@nestjs/swagger';
import { TrainingListItemResponseDto } from './training-list-item-response.dto';

export class PaginatedTrainingsResponseDto {
  @ApiProperty({
    type: [TrainingListItemResponseDto],
    description: 'Lista de treinamentos da página atual',
  })
  data: TrainingListItemResponseDto[];

  @ApiProperty({ description: 'Número total de treinamentos', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
