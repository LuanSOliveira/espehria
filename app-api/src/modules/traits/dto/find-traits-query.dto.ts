import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class FindTraitsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtro por nome do traço (busca parcial, case-insensitive)',
    example: 'Perfurante',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filtro pelo ID do tipo de traço (Arma ou Armadura)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4')
  traitTypeId?: string;

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
