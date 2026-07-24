import { ApiProperty } from '@nestjs/swagger';
import { DivinityCategory } from '../entities/divinity-category.entity';

export class DivinityCategoryResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da categoria',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Divindade Maior',
  })
  name: string;

  static fromEntity(category: DivinityCategory): DivinityCategoryResponseDto {
    const dto = new DivinityCategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    return dto;
  }
}
