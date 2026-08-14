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

export class CreateShieldDto {
  @ApiProperty({
    example: 'Escudo de Torre',
    description: 'Nome do escudo (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/escudo-de-torre.jpg',
    description: 'URL de uma imagem de referência do escudo',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Um escudo grande capaz de cobrir todo o corpo</p>',
    description: 'Descrição do escudo (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Preço do escudo (valor inteiro, opcional)',
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
    description: 'Informações privadas do escudo (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas ao escudo, na ordem de inserção preservada (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    example: 'Escudo da Guarda',
    description: 'Apelido do escudo (opcional)',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    example: 15.5,
    description: 'Volume do escudo (no máximo 1 casa decimal, opcional)',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'O volume deve ter no máximo 1 casa decimal.' },
  )
  @Min(0, { message: 'O volume não pode ser negativo.' })
  volume?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Bônus de CA do escudo, mínimo 0 (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'O bônus de CA deve ser um número inteiro.' })
  @Min(0, { message: 'O bônus de CA não pode ser negativo.' })
  armorClassBonus?: number;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Penalidade de velocidade em metros do escudo (no máximo 1 casa decimal, opcional)',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'A penalidade de velocidade deve ter no máximo 1 casa decimal.' },
  )
  @Min(0, { message: 'A penalidade de velocidade não pode ser negativa.' })
  speedPenaltyMeters?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Dureza do escudo, mínimo 0 (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'A dureza deve ser um número inteiro.' })
  @Min(0, { message: 'A dureza não pode ser negativa.' })
  hardness?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Pontos de vida do escudo, mínimo 0 (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'Os pontos de vida devem ser um número inteiro.' })
  @Min(0, { message: 'Os pontos de vida não podem ser negativos.' })
  hitPoints?: number;
}
