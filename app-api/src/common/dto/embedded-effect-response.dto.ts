import { ApiProperty } from '@nestjs/swagger';
import type { EmbeddedEffect } from '../interfaces/embedded-effect.interface';

export class EmbeddedEffectResponseDto {
  @ApiProperty({
    example: 'Flamejante',
    description: 'Nome do encantamento/aprimoramento',
  })
  name: string;

  @ApiProperty({
    example: '<p>Causa dano de fogo adicional</p>',
    description:
      'Efeito do encantamento/aprimoramento (suporta HTML, pode ser nulo)',
    nullable: true,
  })
  effect: string | null;

  static fromEntity(item: EmbeddedEffect): EmbeddedEffectResponseDto {
    const dto = new EmbeddedEffectResponseDto();
    dto.name = item.name;
    dto.effect = item.effect;
    return dto;
  }
}
