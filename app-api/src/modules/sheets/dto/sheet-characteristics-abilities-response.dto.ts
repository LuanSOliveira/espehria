import { ApiProperty } from '@nestjs/swagger';
import { SheetAbilityCardResponseDto } from './sheet-ability-card-response.dto';

export class SheetCharacteristicsAbilitiesResponseDto {
  @ApiProperty({
    type: () => [SheetAbilityCardResponseDto],
    description:
      'Características herdadas (via Raça, Biografia ou outra entidade vinculada à ficha)',
  })
  inherited: SheetAbilityCardResponseDto[];

  @ApiProperty({
    type: () => [SheetAbilityCardResponseDto],
    description: 'Características adicionadas como extras à ficha',
  })
  extras: SheetAbilityCardResponseDto[];

  static fromRaw(raw: {
    inherited: SheetAbilityCardResponseDto[];
    extras: SheetAbilityCardResponseDto[];
  }): SheetCharacteristicsAbilitiesResponseDto {
    const dto = new SheetCharacteristicsAbilitiesResponseDto();
    dto.inherited = raw.inherited;
    dto.extras = raw.extras;
    return dto;
  }
}
