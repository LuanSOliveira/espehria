import { ApiProperty } from '@nestjs/swagger';
import type { WeaponEmbeddedEffect } from '../interfaces/weapon-embedded-effect.interface';

export class WeaponEmbeddedEffectResponseDto {
  @ApiProperty({
    example: 'Flamejante',
    description: 'Nome do encantamento/aprimoramento',
  })
  name: string;

  @ApiProperty({
    example: '<p>A arma causa dano de fogo adicional</p>',
    description:
      'Efeito do encantamento/aprimoramento (suporta HTML, pode ser nulo)',
    nullable: true,
  })
  effect: string | null;

  static fromEntity(
    item: WeaponEmbeddedEffect,
  ): WeaponEmbeddedEffectResponseDto {
    const dto = new WeaponEmbeddedEffectResponseDto();
    dto.name = item.name;
    dto.effect = item.effect;
    return dto;
  }
}
