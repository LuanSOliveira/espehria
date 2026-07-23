import { ApiProperty } from '@nestjs/swagger';
import { Era } from '../entities/era.entity';

export class EraOptionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da era',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da era',
    example: 'Era Antiga',
  })
  name: string;

  @ApiProperty({
    description: 'Posição de ordenação da era',
    example: 1,
  })
  order: number;

  static fromEntity(era: Era): EraOptionResponseDto {
    const dto = new EraOptionResponseDto();
    dto.id = era.id;
    dto.name = era.name;
    dto.order = era.order;
    return dto;
  }
}
