import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enchantment } from '../entities/enchantment.entity';
import { EnchantmentType } from '../enums/enchantment-type.enum';

export class EnchantmentResponseDto {
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

  @ApiPropertyOptional({
    description: 'Efeito do encantamento em HTML',
    example: '<p>Causa dano de fogo adicional</p>',
  })
  effect: string | null;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(enchantment: Enchantment): EnchantmentResponseDto {
    const dto = new EnchantmentResponseDto();
    dto.id = enchantment.id;
    dto.name = enchantment.name;
    dto.type = enchantment.type;
    dto.effect = enchantment.effect;
    dto.createdAt = enchantment.createdAt;
    dto.updatedAt = enchantment.updatedAt;
    return dto;
  }
}
