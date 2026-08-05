import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Talent } from '../../talents/entities/talent.entity';
import { Training } from '../../trainings/entities/training.entity';
import { Characteristic } from '../../characteristics/entities/characteristic.entity';
import { Biography } from '../../biographies/entities/biography.entity';
import { Race } from '../../races/entities/race.entity';
import { ProficiencyProperty } from '../../proficiency-properties/entities/proficiency-property.entity';
import { ProficiencyGradation } from '../../proficiency-gradations/entities/proficiency-gradation.entity';

@Entity('proficiencies')
@Check(
  'CK_proficiencies_owner_exclusive',
  'num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1',
)
@Unique([
  'ownerTalent',
  'ownerTraining',
  'ownerCharacteristic',
  'ownerBiography',
  'ownerRace',
  'property',
])
export class Proficiency extends BaseEntity {
  @Column({ type: 'int', name: 'sort_order' })
  sortOrder!: number;

  @ManyToOne(() => ProficiencyProperty, { nullable: false })
  @JoinColumn({ name: 'property_id' })
  property!: ProficiencyProperty;

  @ManyToOne(() => ProficiencyGradation, { nullable: false })
  @JoinColumn({ name: 'gradation_id' })
  gradation!: ProficiencyGradation;

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

  @ManyToOne(() => Race, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_race_id' })
  ownerRace!: Race | null;
}
