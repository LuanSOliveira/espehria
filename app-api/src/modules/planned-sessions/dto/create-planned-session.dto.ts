import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PlannedSessionSectionInputDto } from './planned-session-section-input.dto';

export class CreatePlannedSessionDto {
  @ApiProperty({
    example: 'Sessão 1 — A Chegada a Valgrim',
    description: 'Nome da sessão planejada (obrigatório)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '<p>Os personagens chegam à vila de Valgrim ao anoitecer.</p>',
    description: 'Introdução da sessão planejada (suporta HTML)',
  })
  @IsOptional()
  @IsString()
  introduction?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas à sessão planejada (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: () => [PlannedSessionSectionInputDto],
    description:
      'Seções da sessão planejada, criadas na ordem fornecida (array de seções)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlannedSessionSectionInputDto)
  sections?: PlannedSessionSectionInputDto[];
}
