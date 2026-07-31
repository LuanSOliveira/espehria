import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTalentDto {
  @ApiProperty({
    example: 'Talento para Persuasão',
    description: 'Nome do talento (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '<p>Facilidade natural em convencer outras pessoas</p>',
    description: 'Descrição do talento (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas ao talento (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
