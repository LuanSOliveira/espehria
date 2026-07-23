import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class FindEventsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtro por nome (busca parcial, case-insensitive)',
    example: 'Batalha',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtro por id da era vinculada (igualdade exata)',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  eraId?: string;

  @ApiPropertyOptional({
    description: 'Filtro por ano de início (igualdade exata)',
    example: 800,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ano de início deve ser um número inteiro.' })
  startYear?: number;

  @ApiPropertyOptional({
    description: 'Filtro por ano de término (igualdade exata)',
    example: 812,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ano de término deve ser um número inteiro.' })
  endYear?: number;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Número da página (começa em 1)',
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
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number;
}
