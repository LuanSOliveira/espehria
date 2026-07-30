import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateConsumableDto {
  @ApiProperty({
    example: 'Poção de Cura',
    description: 'Nome do consumível (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/pocao-de-cura.jpg',
    description: 'URL de uma imagem de referência do consumível',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Poção que restaura vitalidade ao ser ingerida</p>',
    description: 'Descrição do consumível (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '15 moedas de prata',
    description: 'Preço do consumível (texto livre, opcional)',
  })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({
    example: '<p>Anotações internas não destinadas ao público</p>',
    description: 'Informações privadas do consumível (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas ao consumível (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
