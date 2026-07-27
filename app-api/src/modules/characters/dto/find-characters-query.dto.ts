import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FindCharactersQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro por nome do personagem (busca parcial, case-insensitive com ILIKE)',
    example: 'Aragorn',
  })
  @IsOptional()
  @IsString()
  name?: string;

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
