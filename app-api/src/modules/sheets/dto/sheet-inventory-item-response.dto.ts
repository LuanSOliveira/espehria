import { ApiProperty } from '@nestjs/swagger';
import { SheetInventoryItem } from '../entities/sheet-inventory-item.entity';
import { SheetInventoryItemCategory } from '../enums/sheet-inventory-item-category.enum';

export class SheetInventoryItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do item de inventário',
  })
  id: string;

  @ApiProperty({
    enum: SheetInventoryItemCategory,
    description: 'Categoria do item',
  })
  category: SheetInventoryItemCategory;

  @ApiProperty({
    description: 'Quantidade do item (inteiro >= 1)',
    example: 1,
  })
  quantity: number;

  @ApiProperty({
    description:
      'Indica se o item está equipado (aplicável apenas às categorias Arma/Armadura/Acessório/Escudo; sempre false nas demais categorias)',
    example: false,
  })
  equipped: boolean;

  @ApiProperty({
    description:
      'Volume unitário do item, extraído do snapshot no momento da adição',
    example: 1.5,
  })
  unitVolume: number;

  @ApiProperty({
    description:
      'Snapshot completo dos campos do item exibidos/editáveis na categoria (nome, imagem, descrição, preço, moeda, informações privadas, tags, volume e demais campos específicos da categoria), copiado no momento da adição — sem qualquer vínculo/FK viva com o registro de catálogo de origem',
  })
  data: Record<string, unknown>;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(item: SheetInventoryItem): SheetInventoryItemResponseDto {
    const dto = new SheetInventoryItemResponseDto();
    dto.id = item.id;
    dto.category = item.category;
    dto.quantity = item.quantity;
    dto.equipped = item.equipped;
    dto.unitVolume = item.unitVolume;
    dto.data = item.data;
    dto.createdAt = item.createdAt;
    dto.updatedAt = item.updatedAt;
    return dto;
  }
}
