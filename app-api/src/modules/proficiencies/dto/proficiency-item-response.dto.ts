import { ApiProperty } from '@nestjs/swagger';
import { Proficiency } from '../entities/proficiency.entity';
import { ProficiencyPropertyResponseDto } from '../../proficiency-properties/dto/proficiency-property-response.dto';
import { ProficiencyGradationResponseDto } from '../../proficiency-gradations/dto/proficiency-gradation-response.dto';

export class ProficiencyItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'b3f1c2a4-5d6e-4f7a-8b9c-0d1e2f3a4b5c',
    description: 'Identificador do registro de proficiência',
  })
  id: string;

  @ApiProperty({
    type: () => ProficiencyPropertyResponseDto,
    description: 'Propriedade da proficiência',
  })
  property: ProficiencyPropertyResponseDto;

  @ApiProperty({
    type: () => ProficiencyGradationResponseDto,
    description: 'Graduação da proficiência',
  })
  gradation: ProficiencyGradationResponseDto;

  static fromResolved(item: Proficiency): ProficiencyItemResponseDto {
    const dto = new ProficiencyItemResponseDto();
    dto.id = item.id;
    dto.property = ProficiencyPropertyResponseDto.fromEntity(item.property);
    dto.gradation = ProficiencyGradationResponseDto.fromEntity(item.gradation);
    return dto;
  }
}
