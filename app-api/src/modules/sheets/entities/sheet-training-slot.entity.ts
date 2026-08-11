import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Training } from '../../trainings/entities/training.entity';
import { Sheet } from './sheet.entity';

@Entity('sheet_training_slots')
@Unique(['sheet', 'slotIndex'])
@Index(
  'IDX_sheet_training_slots_sheet_training_unique',
  ['sheet', 'training'],
  { unique: true, where: 'training_id IS NOT NULL' },
)
export class SheetTrainingSlot extends BaseEntity {
  @Column({ type: 'int', name: 'slot_index' })
  slotIndex!: number;

  @ManyToOne(() => Sheet, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sheet_id' })
  sheet!: Sheet;

  @ManyToOne(() => Training, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'training_id' })
  training!: Training | null;
}
