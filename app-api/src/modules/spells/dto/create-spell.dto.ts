import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateSpellDto {
  @ApiProperty({
    example: 'Bola de Fogo',
    description: 'Nome da magia (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/bola-de-fogo.jpg',
    description: 'URL de uma imagem de referência da magia',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Uma esfera flamejante que explode ao impacto</p>',
    description: 'Descrição da magia (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à magia (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
