import { ApiProperty } from '@nestjs/swagger';
import { SheetInventoryItemCategory } from '../enums/sheet-inventory-item-category.enum';
import { SheetInventoryItemResponseDto } from './sheet-inventory-item-response.dto';

export class SheetInventoryListResponseDto {
  @ApiProperty({
    description:
      'Quantidade de cards de inventário por categoria (sempre reflete o total por categoria na ficha, não afetado pelos filtros category/equippedOnly da listagem)',
    example: {
      utility: 2,
      consumable: 1,
      material: 0,
      ammunition: 3,
      weapon: 1,
      armor: 1,
      accessory: 0,
      shield: 0,
    },
  })
  counts: Record<SheetInventoryItemCategory, number>;

  @ApiProperty({
    type: () => [SheetInventoryItemResponseDto],
    description: 'Itens de inventário da ficha, já filtrados pela consulta',
  })
  items: SheetInventoryItemResponseDto[];

  static fromRaw(raw: {
    counts: Record<SheetInventoryItemCategory, number>;
    items: SheetInventoryItemResponseDto[];
  }): SheetInventoryListResponseDto {
    const dto = new SheetInventoryListResponseDto();
    dto.counts = raw.counts;
    dto.items = raw.items;
    return dto;
  }
}
