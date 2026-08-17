import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DamageTypeResponseDto } from '../../damage-types/dto/damage-type-response.dto';
import { WeaponAlternativeDamage } from '../entities/weapon-alternative-damage.entity';
import { WeaponExtraDamage } from '../entities/weapon-extra-damage.entity';
import { WeaponDamageDie } from '../enums/weapon-damage-die.enum';

export class WeaponDamageResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do item de dano',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Valor do dano',
    example: 2,
  })
  damageValue: number | null;

  @ApiPropertyOptional({
    enum: WeaponDamageDie,
    description: 'Dado de dano (d2, d4, d6, d8, d10, d12, d20 ou d100)',
  })
  damageDie: WeaponDamageDie | null;

  @ApiPropertyOptional({
    type: () => DamageTypeResponseDto,
    description: 'Tipo de dano',
  })
  damageType: DamageTypeResponseDto | null;

  @ApiProperty({
    description: 'Indica se o dano é mágico',
    example: false,
  })
  magicalDamage: boolean;

  @ApiPropertyOptional({
    description: 'Distância em metros',
    example: 9,
  })
  distanceMeters: number | null;

  @ApiProperty({
    description: 'Indica se usa munição',
    example: false,
  })
  usesAmmunition: boolean;

  @ApiPropertyOptional({
    description: 'Número de ações de recarga',
    example: 1,
  })
  reloadActions: number | null;

  @ApiProperty({
    description: 'Posição do item na sequência de inserção',
    example: 0,
  })
  order: number;

  static fromEntity(
    damage: WeaponAlternativeDamage | WeaponExtraDamage,
  ): WeaponDamageResponseDto {
    const dto = new WeaponDamageResponseDto();
    dto.id = damage.id;
    dto.damageValue = damage.damageValue;
    dto.damageDie = damage.damageDie;
    dto.damageType = damage.damageType
      ? DamageTypeResponseDto.fromEntity(damage.damageType)
      : null;
    dto.magicalDamage = damage.magicalDamage;
    dto.distanceMeters = damage.distanceMeters;
    dto.usesAmmunition = damage.usesAmmunition;
    dto.reloadActions = damage.reloadActions;
    dto.order = damage.order;
    return dto;
  }
}
