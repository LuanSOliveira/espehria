import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ProficiencyItemInputDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador da propriedade de proficiência',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  property!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador da graduação de proficiência',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  gradation!: string;
}
