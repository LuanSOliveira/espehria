import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateAmmunitionDto {
  @ApiProperty({
    example: 'Flecha de Aço',
    description: 'Nome do item de munição (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/flecha-de-aco.jpg',
    description: 'URL de uma imagem de referência do item de munição',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Flecha com ponta de aço reforçado</p>',
    description: 'Descrição do item de munição (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '5 moedas de cobre',
    description: 'Preço do item de munição (texto livre, opcional)',
  })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({
    example: '<p>Anotações internas não destinadas ao público</p>',
    description:
      'Informações privadas do item de munição (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas ao item de munição (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
