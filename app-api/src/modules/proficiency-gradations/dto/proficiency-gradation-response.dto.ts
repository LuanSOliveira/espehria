import { ApiProperty } from '@nestjs/swagger';
import { ProficiencyGradation } from '../entities/proficiency-gradation.entity';

export class ProficiencyGradationResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da graduação de proficiência',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da graduação de proficiência',
    example: 'Básico',
  })
  name: string;

  @ApiProperty({
    description: 'Nível de magnitude da graduação de proficiência',
    example: 2,
  })
  level: number;

  static fromEntity(
    gradation: ProficiencyGradation,
  ): ProficiencyGradationResponseDto {
    const dto = new ProficiencyGradationResponseDto();
    dto.id = gradation.id;
    dto.name = gradation.name;
    dto.level = gradation.level;
    return dto;
  }
}
