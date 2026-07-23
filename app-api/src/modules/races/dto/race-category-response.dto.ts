import { ApiProperty } from '@nestjs/swagger';
import { RaceCategory } from '../entities/race-category.entity';

export class RaceCategoryResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da categoria',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Humanoide',
  })
  name: string;

  static fromEntity(category: RaceCategory): RaceCategoryResponseDto {
    const dto = new RaceCategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    return dto;
  }
}
