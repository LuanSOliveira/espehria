import { ApiProperty } from '@nestjs/swagger';
import { ArmorCategory } from '../entities/armor-category.entity';

export class ArmorCategoryResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da categoria de armadura',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da categoria de armadura',
    example: 'Armadura Média',
  })
  name: string;

  @ApiProperty({
    description: 'Posição de exibição da categoria de armadura (ordem crescente)',
    example: 3,
  })
  order: number;

  static fromEntity(armorCategory: ArmorCategory): ArmorCategoryResponseDto {
    const dto = new ArmorCategoryResponseDto();
    dto.id = armorCategory.id;
    dto.name = armorCategory.name;
    dto.order = armorCategory.order;
    return dto;
  }
}
