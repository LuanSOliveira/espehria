import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EnchantmentType } from '../enums/enchantment-type.enum';

export class FindEnchantmentsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro por nome do encantamento (busca parcial, case-insensitive)',
    example: 'Flamejante',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: EnchantmentType,
    description: 'Filtro pelo tipo do encantamento (igualdade exata)',
  })
  @IsOptional()
  @IsEnum(EnchantmentType)
  type?: EnchantmentType;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Número da página (começa em 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    default: 20,
    description: 'Quantidade de itens por página',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number;
}
