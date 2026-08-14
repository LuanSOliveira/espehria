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

export class FindPlannedSessionsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro por nome da sessão planejada (busca parcial, case-insensitive com ILIKE)',
    example: 'Chegada',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    isArray: true,
    description:
      'Filtro por tags (array de UUIDs). Retorna apenas sessões planejadas que possuem TODAS as tags informadas (AND). Na querystring, use a notação com colchetes: `tagIds[]=uuid1&tagIds[]=uuid2&...`',
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
