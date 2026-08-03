import { ApiProperty } from '@nestjs/swagger';
import { ImprovementFlawType } from '../entities/improvement-flaw-type.entity';

export class ImprovementFlawTypeResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do tipo de melhoria/defeito',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do tipo de melhoria/defeito',
    example: 'Ataque',
  })
  name: string;

  static fromEntity(
    type: ImprovementFlawType,
  ): ImprovementFlawTypeResponseDto {
    const dto = new ImprovementFlawTypeResponseDto();
    dto.id = type.id;
    dto.name = type.name;
    return dto;
  }
}
