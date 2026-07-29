import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    example: 'A Grande Batalha',
    description: 'Nome do evento (obrigatório, não é único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/grande-batalha.jpg',
    description: 'URL de uma imagem de referência do evento',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImageUrl?: string;

  @ApiPropertyOptional({
    example: 800,
    description: 'Ano de início do evento (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'O ano de início deve ser um número inteiro.' })
  startYear?: number;

  @ApiPropertyOptional({
    example: 812,
    description: 'Ano de término do evento (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'O ano de término deve ser um número inteiro.' })
  endYear?: number;

  @ApiPropertyOptional({
    example: '<p>Confronto decisivo entre os reinos do norte e do sul</p>',
    description: 'Descrição do evento (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '<p>Anotações internas não destinadas ao público</p>',
    description: 'Informações privadas do evento (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID da era vinculada ao evento (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  eraId?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas ao evento (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
