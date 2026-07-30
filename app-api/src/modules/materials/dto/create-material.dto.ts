import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({
    example: 'Minério de Ferro',
    description: 'Nome do material (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/minerio-de-ferro.jpg',
    description: 'URL de uma imagem de referência do material',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Minério bruto extraído das minas do norte</p>',
    description: 'Descrição do material (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '10 moedas de prata',
    description: 'Preço do material (texto livre, opcional)',
  })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({
    example: '<p>Anotações internas não destinadas ao público</p>',
    description: 'Informações privadas do material (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas ao material (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
