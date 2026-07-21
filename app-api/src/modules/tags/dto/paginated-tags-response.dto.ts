import { ApiProperty } from '@nestjs/swagger';
import { TagResponseDto } from './tag-response.dto';

export class PaginatedTagsResponseDto {
  @ApiProperty({
    type: [TagResponseDto],
    description: 'Array de tags da página',
  })
  data: TagResponseDto[];

  @ApiProperty({ description: 'Total de tags encontradas' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página' })
  perPage: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}
