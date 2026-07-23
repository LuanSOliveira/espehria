import { ApiProperty } from '@nestjs/swagger';
import { Era } from '../entities/era.entity';

export class EraSummaryResponseDto {
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

  static fromEntity(era: Era | null): EraSummaryResponseDto | null {
    if (!era) {
      return null;
    }
    const dto = new EraSummaryResponseDto();
    dto.id = era.id;
    dto.name = era.name;
    return dto;
  }
}
