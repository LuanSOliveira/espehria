import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enchantment } from '../entities/enchantment.entity';
import { EnchantmentType } from '../enums/enchantment-type.enum';

export class EnchantmentListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do encantamento',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do encantamento',
    example: 'Flamejante',
  })
  name: string;

  @ApiPropertyOptional({
    enum: EnchantmentType,
    description: 'Tipo do encantamento',
  })
  type: EnchantmentType | null;

  static fromEntity(enchantment: Enchantment): EnchantmentListItemResponseDto {
    const dto = new EnchantmentListItemResponseDto();
    dto.id = enchantment.id;
    dto.name = enchantment.name;
    dto.type = enchantment.type;
    return dto;
  }
}
