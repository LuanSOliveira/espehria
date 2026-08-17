import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EnchantmentType } from '../enums/enchantment-type.enum';

export class CreateEnchantmentDto {
  @ApiProperty({
    example: 'Flamejante',
    description: 'Nome do encantamento (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    enum: EnchantmentType,
    description: 'Tipo do encantamento',
  })
  @IsOptional()
  @IsEnum(EnchantmentType)
  type?: EnchantmentType;

  @ApiPropertyOptional({
    example: '<p>Causa dano de fogo adicional</p>',
    description: 'Efeito do encantamento (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  effect?: string;
}
