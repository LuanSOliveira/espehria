import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Training } from '../../trainings/entities/training.entity';
import { Talent } from '../../talents/entities/talent.entity';
import { Characteristic } from '../../characteristics/entities/characteristic.entity';
import { Sheet } from './sheet.entity';
import { SheetAbilityBucketType } from '../enums/sheet-ability-bucket-type.enum';

@Entity('sheet_ability_extras')
@Check(
  'CK_sheet_ability_extras_target_exclusive',
  'num_nonnulls(training_id, talent_id, characteristic_id) = 1',
)
@Index(
  'IDX_sheet_ability_extras_sheet_training_unique',
  ['sheet', 'training'],
  { unique: true, where: 'training_id IS NOT NULL' },
)
@Index('IDX_sheet_ability_extras_sheet_talent_unique', ['sheet', 'talent'], {
  unique: true,
  where: 'talent_id IS NOT NULL',
})
@Index(
  'IDX_sheet_ability_extras_sheet_characteristic_unique',
  ['sheet', 'characteristic'],
  { unique: true, where: 'characteristic_id IS NOT NULL' },
)
export class SheetAbilityExtra extends BaseEntity {
  @Column({
    type: 'enum',
    enum: SheetAbilityBucketType,
    name: 'entity_type',
  })
  entityType!: SheetAbilityBucketType;

  @ManyToOne(() => Sheet, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sheet_id' })
  sheet!: Sheet;

  @ManyToOne(() => Training, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'training_id' })
  training!: Training | null;

  @ManyToOne(() => Talent, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'talent_id' })
  talent!: Talent | null;

  @ManyToOne(() => Characteristic, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characteristic_id' })
  characteristic!: Characteristic | null;
}
