import { ApiProperty } from '@nestjs/swagger';
import { CreatureCategory } from '../entities/creature-category.entity';

export class CreatureCategoryResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador único da categoria' })
  id: string;

  @ApiProperty({ description: 'Nome da categoria', example: 'Monstro' })
  name: string;

  static fromEntity(category: CreatureCategory): CreatureCategoryResponseDto {
    const dto = new CreatureCategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    return dto;
  }
}
