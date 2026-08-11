import { ApiProperty } from '@nestjs/swagger';
import { SheetResponseDto } from './sheet-response.dto';
import { SheetAbilitiesResponseDto } from './sheet-abilities-response.dto';

export class SheetAbilitiesMutationResponseDto {
  @ApiProperty({
    type: () => SheetResponseDto,
    description:
      'Ficha atualizada (reflete melhorias/defeitos/proficiências/saberes recalculados)',
  })
  sheet: SheetResponseDto;

  @ApiProperty({
    type: () => SheetAbilitiesResponseDto,
    description: 'Listagem consolidada de habilidades da ficha, já recalculada',
  })
  abilities: SheetAbilitiesResponseDto;

  static fromRaw(raw: {
    sheet: SheetResponseDto;
    abilities: SheetAbilitiesResponseDto;
  }): SheetAbilitiesMutationResponseDto {
    const dto = new SheetAbilitiesMutationResponseDto();
    dto.sheet = raw.sheet;
    dto.abilities = raw.abilities;
    return dto;
  }
}
