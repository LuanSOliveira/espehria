import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Talent } from '../../talents/entities/talent.entity';
import { Training } from '../../trainings/entities/training.entity';
import { Characteristic } from '../../characteristics/entities/characteristic.entity';
import { Biography } from '../../biographies/entities/biography.entity';
import { Race } from '../../races/entities/race.entity';
import { ProficiencyGradation } from '../../proficiency-gradations/entities/proficiency-gradation.entity';

@Entity('knowledges')
@Check(
  'CK_knowledges_owner_exclusive',
  'num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1',
)
export class Knowledge extends BaseEntity {
  @Column({ type: 'int', name: 'sort_order' })
  sortOrder!: number;

  @Column()
  title!: string;

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
