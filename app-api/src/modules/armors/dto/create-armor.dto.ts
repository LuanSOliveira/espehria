import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateArmorDto {
  @ApiProperty({
    example: 'Armadura de Placas',
    description: 'Nome da armadura (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/armadura-de-placas.jpg',
    description: 'URL de uma imagem de referência da armadura',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Uma armadura pesada feita de placas de aço</p>',
    description: 'Descrição da armadura (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Preço da armadura (valor inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'O preço deve ser um número inteiro.' })
  @Min(0, { message: 'O preço não pode ser negativo.' })
  price?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'ID da moeda associada ao preço (obrigatório quando o preço é informado)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ValidateIf((dto) => dto.price !== undefined && dto.price !== null)
  @IsUUID('4', { message: 'A moeda é obrigatória quando o preço é informado.' })
  currencyId?: string;

  @ApiPropertyOptional({
    example: '<p>Anotações internas não destinadas ao público</p>',
    description: 'Informações privadas da armadura (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas à armadura, na ordem de inserção preservada (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
