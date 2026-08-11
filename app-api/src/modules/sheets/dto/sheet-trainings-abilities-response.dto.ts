import { ApiProperty } from '@nestjs/swagger';
import { SheetAbilityCardResponseDto } from './sheet-ability-card-response.dto';
import { SheetTrainingSlotResponseDto } from './sheet-training-slot-response.dto';

export class SheetTrainingsAbilitiesResponseDto {
  @ApiProperty({
    type: () => [SheetTrainingSlotResponseDto],
    description:
      'Slots de Treinamento da ficha (quantidade = 3 + (nível da ficha - 1)), vazios ou preenchidos',
  })
  slots: SheetTrainingSlotResponseDto[];

  @ApiProperty({
    type: () => [SheetAbilityCardResponseDto],
    description:
      'Treinamentos herdados (via Biografia ou outra entidade vinculada à ficha — Raça não contribui Treinamentos)',
  })
  inherited: SheetAbilityCardResponseDto[];

  @ApiProperty({
    type: () => [SheetAbilityCardResponseDto],
    description: 'Treinamentos adicionados como extras à ficha',
  })
  extras: SheetAbilityCardResponseDto[];

  static fromRaw(raw: {
    slots: SheetTrainingSlotResponseDto[];
    inherited: SheetAbilityCardResponseDto[];
    extras: SheetAbilityCardResponseDto[];
  }): SheetTrainingsAbilitiesResponseDto {
    const dto = new SheetTrainingsAbilitiesResponseDto();
    dto.slots = raw.slots;
    dto.inherited = raw.inherited;
    dto.extras = raw.extras;
    return dto;
  }
}
