import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
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

  @ApiPropertyOptional({
    example: 'Couraça da Guarda',
    description: 'Apelido da armadura (opcional)',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    example: 15.5,
    description: 'Volume da armadura (no máximo 1 casa decimal, opcional)',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'O volume deve ter no máximo 1 casa decimal.' },
  )
  @Min(0, { message: 'O volume não pode ser negativo.' })
  volume?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID da categoria da armadura (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4')
  armorCategoryId?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Bônus de CA da armadura, mínimo 0 (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'O bônus de CA deve ser um número inteiro.' })
  @Min(0, { message: 'O bônus de CA não pode ser negativo.' })
  armorClassBonus?: number;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Limite de modificador de Destreza da armadura, mínimo 1 (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({
    message: 'O limite de modificador de Destreza deve ser um número inteiro.',
  })
  @Min(1, {
    message: 'O limite de modificador de Destreza deve ser no mínimo 1.',
  })
  dexterityModifierLimit?: number;

  @ApiPropertyOptional({
    example: 13,
    description:
      'Força mínima exigida pela armadura, mínimo 0 (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'A força deve ser um número inteiro.' })
  @Min(0, { message: 'A força não pode ser negativa.' })
  strength?: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Penalidade em teste da armadura, mínimo 1 (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'A penalidade em teste deve ser um número inteiro.' })
  @Min(1, { message: 'A penalidade em teste deve ser no mínimo 1.' })
  checkPenalty?: number;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Penalidade de velocidade em metros da armadura (no máximo 1 casa decimal, opcional)',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1 },
    {
      message: 'A penalidade de velocidade deve ter no máximo 1 casa decimal.',
    },
  )
  @Min(0, { message: 'A penalidade de velocidade não pode ser negativa.' })
  speedPenaltyMeters?: number;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs dos traços associados à armadura, na ordem de inserção preservada (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  traitIds?: string[];
}
