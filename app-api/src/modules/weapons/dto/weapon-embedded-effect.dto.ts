import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WeaponEmbeddedEffectDto {
  @ApiProperty({
    example: 'Flamejante',
    description: 'Nome do encantamento/aprimoramento (obrigatório)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '<p>A arma causa dano de fogo adicional</p>',
    description:
      'Efeito do encantamento/aprimoramento (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  effect?: string;
}
