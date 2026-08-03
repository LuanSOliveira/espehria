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
    format: 'uuid',
    description:
      'Identificador do tipo de melhoria/defeito ao qual esta propriedade pertence',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  typeId: string;

  static fromEntity(
    property: ImprovementFlawProperty,
  ): ImprovementFlawPropertyResponseDto {
    const dto = new ImprovementFlawPropertyResponseDto();
    dto.id = property.id;
    dto.name = property.name;
    dto.typeId = property.type.id;
    return dto;
  }
}
