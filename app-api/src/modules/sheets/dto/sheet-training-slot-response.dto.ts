import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SheetAbilityCardResponseDto } from './sheet-ability-card-response.dto';

export class SheetTrainingSlotResponseDto {
  @ApiProperty({
    description: 'Posição do slot na ficha (1-based)',
    example: 1,
  })
  slotIndex: number;

  @ApiProperty({
    description:
      'Nível da ficha em que este slot foi liberado (derivado de slotIndex: slotIndex <= 3 ? 1 : slotIndex - 2)',
    example: 1,
  })
  unlockedAtLevel: number;

  @ApiPropertyOptional({
    type: () => SheetAbilityCardResponseDto,
    nullable: true,
    description:
      'Treinamento que preenche este slot (nulo se o slot estiver vazio)',
  })
  training: SheetAbilityCardResponseDto | null;

  static fromRaw(slot: {
    slotIndex: number;
    unlockedAtLevel: number;
    training: SheetAbilityCardResponseDto | null;
  }): SheetTrainingSlotResponseDto {
    const dto = new SheetTrainingSlotResponseDto();
    dto.slotIndex = slot.slotIndex;
    dto.unlockedAtLevel = slot.unlockedAtLevel;
    dto.training = slot.training;
    return dto;
  }
}
