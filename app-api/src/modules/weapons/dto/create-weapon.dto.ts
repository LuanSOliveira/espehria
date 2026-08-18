import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WeaponHands } from '../enums/weapon-hands.enum';
import { WeaponStyle } from '../enums/weapon-style.enum';
import { WeaponDamageDie } from '../enums/weapon-damage-die.enum';
import { WeaponDamageInputDto } from './weapon-damage-input.dto';
import { EmbeddedEffectDto } from '../../../common/dto/embedded-effect.dto';

export class CreateWeaponDto {
  @ApiProperty({
    example: 'Espada Longa',
    description: 'Nome da arma (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/espada-longa.jpg',
    description: 'URL de uma imagem de referência da arma',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Uma espada longa forjada em aço</p>',
    description: 'Descrição da arma (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Preço da arma (valor inteiro, opcional)',
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
    description: 'Informações privadas da arma (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas à arma, na ordem de inserção preservada (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    example: 'Punhal do Vento',
    description: 'Apelido da arma (opcional)',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    example: 1.5,
    description: 'Volume da arma (no máximo 1 casa decimal, opcional)',
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
    description: 'ID do grau de tamanho da arma (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4')
  sizeGradeId?: string;

  @ApiPropertyOptional({
    enum: WeaponHands,
    description:
      'Quantidade de mãos necessárias para usar a arma: 1 ou 2 (opcional)',
  })
  @IsOptional()
  @IsEnum(WeaponHands)
  hands?: WeaponHands;

  @ApiPropertyOptional({
    enum: WeaponStyle,
    description: 'Estilo da arma: Corpo a Corpo ou A Distância (opcional)',
  })
  @IsOptional()
  @IsEnum(WeaponStyle)
  weaponStyle?: WeaponStyle;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs dos traços associados à arma, na ordem de inserção preservada (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  traitIds?: string[];

  @ApiPropertyOptional({
    example: 2,
    description: 'Valor do dano da arma (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'O valor do dano deve ser um número inteiro.' })
  @Min(0, { message: 'O valor do dano não pode ser negativo.' })
  damageValue?: number;

  @ApiPropertyOptional({
    enum: WeaponDamageDie,
    description:
      'Dado de dano da arma (d2, d4, d6, d8, d10, d12, d20 ou d100, opcional)',
  })
  @IsOptional()
  @IsEnum(WeaponDamageDie)
  damageDie?: WeaponDamageDie;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID do tipo de dano da arma (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4')
  damageTypeId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica se o dano da arma é mágico (padrão: false)',
  })
  @IsOptional()
  @IsBoolean()
  magicalDamage?: boolean;

  @ApiPropertyOptional({
    example: 9,
    description:
      'Distância em metros da arma (no máximo 1 casa decimal, opcional)',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'A distância deve ter no máximo 1 casa decimal.' },
  )
  @Min(0, { message: 'A distância não pode ser negativa.' })
  distanceMeters?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica se a arma usa munição (padrão: false)',
  })
  @IsOptional()
  @IsBoolean()
  usesAmmunition?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Número de ações de recarga da arma (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'As ações de recarga devem ser um número inteiro.' })
  @Min(0, { message: 'As ações de recarga não podem ser negativas.' })
  reloadActions?: number;

  @ApiPropertyOptional({
    type: () => [WeaponDamageInputDto],
    description:
      'Danos alternativos da arma (lista independente com os mesmos 7 campos do dano principal), na ordem de inserção preservada. Cada item pode incluir valor, dado, tipo de dano, dano mágico, distância, munição e ações de recarga',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeaponDamageInputDto)
  alternativeDamages?: WeaponDamageInputDto[];

  @ApiPropertyOptional({
    type: () => [WeaponDamageInputDto],
    description:
      'Danos extras da arma (lista independente com os mesmos 7 campos do dano principal), na ordem de inserção preservada. Cada item pode incluir valor, dado, tipo de dano, dano mágico, distância, munição e ações de recarga',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeaponDamageInputDto)
  extraDamages?: WeaponDamageInputDto[];

  @ApiPropertyOptional({
    type: () => [EmbeddedEffectDto],
    description:
      'Encantamentos da arma: cópia independente de nome/efeito escolhidos do catálogo de Encantamentos, sem vínculo/FK com a entidade Enchantment. Ordem de inserção preservada. Cada item deve conter um nome (obrigatório) e um efeito opcional',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmbeddedEffectDto)
  enchantments?: EmbeddedEffectDto[];

  @ApiPropertyOptional({
    type: () => [EmbeddedEffectDto],
    description:
      'Aprimoramentos da arma: cópia independente de nome/efeito escolhidos do catálogo de Aprimoramentos, sem vínculo/FK com a entidade Enhancement. Ordem de inserção preservada. Cada item deve conter um nome (obrigatório) e um efeito opcional',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmbeddedEffectDto)
  enhancements?: EmbeddedEffectDto[];
}
