import { ApiProperty } from '@nestjs/swagger';
import { SheetResponseDto } from './sheet-response.dto';
import { SheetInventoryListResponseDto } from './sheet-inventory-list-response.dto';

export class SheetInventoryMutationResponseDto {
  @ApiProperty({
    type: () => SheetResponseDto,
    description:
      'Ficha atualizada (reflete itemsVolume/loadedVolume recalculados)',
  })
  sheet: SheetResponseDto;

  @ApiProperty({
    type: () => SheetInventoryListResponseDto,
    description: 'Listagem de inventário da ficha, já atualizada',
  })
  inventory: SheetInventoryListResponseDto;

  static fromRaw(raw: {
    sheet: SheetResponseDto;
    inventory: SheetInventoryListResponseDto;
  }): SheetInventoryMutationResponseDto {
    const dto = new SheetInventoryMutationResponseDto();
    dto.sheet = raw.sheet;
    dto.inventory = raw.inventory;
    return dto;
  }
}
