import { ApiProperty } from '@nestjs/swagger';
import { ProficiencyProperty } from '../entities/proficiency-property.entity';

export class ProficiencyPropertyResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da propriedade de proficiência',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da propriedade de proficiência',
    example: 'Acrobatismo',
  })
  name: string;

  static fromEntity(
    property: ProficiencyProperty,
  ): ProficiencyPropertyResponseDto {
    const dto = new ProficiencyPropertyResponseDto();
    dto.id = property.id;
    dto.name = property.name;
    return dto;
  }
}
