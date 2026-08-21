import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Sheet } from './sheet.entity';
import { SheetInventoryItemCategory } from '../enums/sheet-inventory-item-category.enum';

@Entity('sheet_inventory_items')
export class SheetInventoryItem extends BaseEntity {
  @ManyToOne(() => Sheet, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sheet_id' })
  sheet!: Sheet;

  @Column({ type: 'enum', enum: SheetInventoryItemCategory, name: 'category' })
  category!: SheetInventoryItemCategory;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'boolean', default: false })
  equipped!: boolean;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    default: 0,
    transformer: DecimalTransformer,
    name: 'unit_volume',
  })
  unitVolume!: number;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;
}
