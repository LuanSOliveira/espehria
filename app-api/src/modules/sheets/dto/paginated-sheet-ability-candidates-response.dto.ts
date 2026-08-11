import { ApiProperty } from '@nestjs/swagger';
import { SheetAbilityCandidateResponseDto } from './sheet-ability-candidate-response.dto';

export class PaginatedSheetAbilityCandidatesResponseDto {
  @ApiProperty({
    type: [SheetAbilityCandidateResponseDto],
    description: 'Lista de candidatos da página atual',
  })
  data: SheetAbilityCandidateResponseDto[];

  @ApiProperty({ description: 'Número total de candidatos', example: 42 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 20 })
  perPage: number;

  @ApiProperty({ description: 'Número total de páginas', example: 3 })
  totalPages: number;
}
