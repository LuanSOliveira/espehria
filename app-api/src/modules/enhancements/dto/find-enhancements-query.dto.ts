import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EnhancementType } from '../enums/enhancement-type.enum';

export class FindEnhancementsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro por nome do aprimoramento (busca parcial, case-insensitive)',
    example: 'Reforçado',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: EnhancementType,
    description: 'Filtro pelo tipo do aprimoramento (igualdade exata)',
  })
  @IsOptional()
  @IsEnum(EnhancementType)
  type?: EnhancementType;

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
