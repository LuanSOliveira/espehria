import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { WeaponDamageDie } from '../enums/weapon-damage-die.enum';

export class WeaponDamageInputDto {
  @ApiPropertyOptional({
    example: 2,
    description: 'Valor do dano (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'O valor do dano deve ser um número inteiro.' })
  @Min(0, { message: 'O valor do dano não pode ser negativo.' })
  damageValue?: number;

  @ApiPropertyOptional({
    enum: WeaponDamageDie,
    description:
      'Dado de dano (d2, d4, d6, d8, d10, d12, d20 ou d100, opcional)',
  })
  @IsOptional()
  @IsEnum(WeaponDamageDie)
  damageDie?: WeaponDamageDie;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID do tipo de dano (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4')
  damageTypeId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica se o dano é mágico (padrão: false)',
  })
  @IsOptional()
  @IsBoolean()
  magicalDamage?: boolean;

  @ApiPropertyOptional({
    example: 9,
    description: 'Distância em metros (no máximo 1 casa decimal, opcional)',
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
    description: 'Indica se usa munição (padrão: false)',
  })
  @IsOptional()
  @IsBoolean()
  usesAmmunition?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Número de ações de recarga (número inteiro, opcional)',
  })
  @IsOptional()
  @IsInt({ message: 'As ações de recarga devem ser um número inteiro.' })
  @Min(0, { message: 'As ações de recarga não podem ser negativas.' })
  reloadActions?: number;
}
