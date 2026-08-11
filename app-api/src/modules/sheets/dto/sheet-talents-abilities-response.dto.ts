import { ApiProperty } from '@nestjs/swagger';
import { SheetAbilityCardResponseDto } from './sheet-ability-card-response.dto';

export class SheetTalentsAbilitiesResponseDto {
  @ApiProperty({
    type: () => [SheetAbilityCardResponseDto],
    description:
      'Talentos herdados (via Raça, Biografia ou outra entidade vinculada à ficha)',
  })
  inherited: SheetAbilityCardResponseDto[];

  @ApiProperty({
    type: () => [SheetAbilityCardResponseDto],
    description: 'Talentos adicionados como extras à ficha',
  })
  extras: SheetAbilityCardResponseDto[];

  static fromRaw(raw: {
    inherited: SheetAbilityCardResponseDto[];
    extras: SheetAbilityCardResponseDto[];
  }): SheetTalentsAbilitiesResponseDto {
    const dto = new SheetTalentsAbilitiesResponseDto();
    dto.inherited = raw.inherited;
    dto.extras = raw.extras;
    return dto;
  }
}
