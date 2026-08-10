import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class FindCharacteristicsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro por nome da característica (busca parcial, case-insensitive com ILIKE)',
    example: 'Força',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtro por nível da característica (valor exato)',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O nível deve ser um número inteiro.' })
  @Min(1, { message: 'O nível deve ser maior ou igual a 1.' })
  level?: number;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    isArray: true,
    description:
      'Filtro por tags (array de UUIDs). Retorna apenas características que possuem TODAS as tags informadas (AND). Na querystring, use a notação com colchetes: `tagIds[]=uuid1&tagIds[]=uuid2&...`',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

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
