import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class FindSheetsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro por nome da ficha (busca parcial, case-insensitive com ILIKE)',
    example: 'Aragorn',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filtro por campanha vinculada à ficha (id exato)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

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
