import { ApiProperty } from '@nestjs/swagger';
import { CharacterListItemResponseDto } from './character-list-item-response.dto';

export class PaginatedCharactersResponseDto {
  @ApiProperty({
    type: [CharacterListItemResponseDto],
    description: 'Lista de personagens da página atual',
  })
  data: CharacterListItemResponseDto[];

  @ApiProperty({ description: 'Número total de personagens', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
