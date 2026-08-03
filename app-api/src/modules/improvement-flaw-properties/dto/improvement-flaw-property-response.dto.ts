import { ApiProperty } from '@nestjs/swagger';
import { ImprovementFlawProperty } from '../entities/improvement-flaw-property.entity';

export class ImprovementFlawPropertyResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da propriedade de melhoria/defeito',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da propriedade de melhoria/defeito',
    example: 'Ataque Corpo-a-Corpo',
  })
  name: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Identificadores dos tipos de melhoria/defeito aos quais esta propriedade pertence',
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
  })
  typeIds: string[];

  static fromEntity(
    property: ImprovementFlawProperty,
  ): ImprovementFlawPropertyResponseDto {
    const dto = new ImprovementFlawPropertyResponseDto();
    dto.id = property.id;
    dto.name = property.name;
    dto.typeIds = property.types.map((type) => type.id);
    return dto;
  }
}
