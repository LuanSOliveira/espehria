import { ApiProperty } from '@nestjs/swagger';
import { SizeGrade } from '../entities/size-grade.entity';

export class SizeGradeResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do grau de tamanho',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do grau de tamanho',
    example: 'Médio',
  })
  name: string;

  @ApiProperty({
    description: 'Posição de exibição do grau de tamanho (ordem crescente)',
    example: 3,
  })
  order: number;

  static fromEntity(sizeGrade: SizeGrade): SizeGradeResponseDto {
    const dto = new SizeGradeResponseDto();
    dto.id = sizeGrade.id;
    dto.name = sizeGrade.name;
    dto.order = sizeGrade.order;
    return dto;
  }
}
