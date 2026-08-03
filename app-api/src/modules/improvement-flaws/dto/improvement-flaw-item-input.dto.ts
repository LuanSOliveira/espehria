import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class ImprovementFlawItemInputDto {
  @ApiProperty({
    example: 3,
    description:
      'Valor do item de melhoria/defeito (número inteiro, mínimo 1)',
  })
  @IsInt({ message: 'O valor deve ser um número inteiro.' })
  @Min(1, { message: 'O valor deve ser maior ou igual a 1.' })
  value!: number;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador do tipo de melhoria/defeito',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  type!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador da propriedade de melhoria/defeito',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  property!: string;
}
