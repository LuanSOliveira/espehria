import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Talent } from '../../talents/entities/talent.entity';
import { Training } from '../../trainings/entities/training.entity';
import { Characteristic } from '../../characteristics/entities/characteristic.entity';
import { Biography } from '../../biographies/entities/biography.entity';
import { ImprovementFlawType } from '../../improvement-flaw-types/entities/improvement-flaw-type.entity';
import { ImprovementFlawProperty } from '../../improvement-flaw-properties/entities/improvement-flaw-property.entity';
import { ImprovementFlawCategory } from '../enums/improvement-flaw-category.enum';

@Entity('improvement_flaws')
@Check(
  'CK_improvement_flaws_owner_exclusive',
  'num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id) = 1',
)
@Unique([
  'category',
  'ownerTalent',
  'ownerTraining',
  'ownerCharacteristic',
  'ownerBiography',
  'type',
  'property',
])
export class ImprovementFlaw extends BaseEntity {
  @Column({ type: 'enum', enum: ImprovementFlawCategory, name: 'category' })
  category!: ImprovementFlawCategory;

  @Column({ type: 'int' })
  value!: number;

  @Column({ type: 'int', name: 'sort_order' })
  sortOrder!: number;

  @ManyToOne(() => ImprovementFlawType, { nullable: false })
  @JoinColumn({ name: 'type_id' })
  type!: ImprovementFlawType;

  @ManyToOne(() => ImprovementFlawProperty, { nullable: false })
  @JoinColumn({ name: 'property_id' })
  property!: ImprovementFlawProperty;

  @ManyToOne(() => Talent, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_talent_id' })
  ownerTalent!: Talent | null;

  @ManyToOne(() => Training, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_training_id' })
  ownerTraining!: Training | null;

  @ManyToOne(() => Characteristic, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_characteristic_id' })
  ownerCharacteristic!: Characteristic | null;

  @ManyToOne(() => Biography, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_biography_id' })
  ownerBiography!: Biography | null;
}
