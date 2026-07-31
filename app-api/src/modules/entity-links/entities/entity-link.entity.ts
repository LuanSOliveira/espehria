import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Training } from '../../trainings/entities/training.entity';
import { Talent } from '../../talents/entities/talent.entity';
import { Technique } from '../../techniques/entities/technique.entity';
import { Spell } from '../../spells/entities/spell.entity';
import { EntityLinkType } from '../enums/entity-link-type.enum';

@Entity('entity_links')
@Check(
  'CK_entity_links_owner_exclusive',
  'num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id) = 1',
)
@Check(
  'CK_entity_links_target_exclusive',
  'num_nonnulls(target_training_id, target_talent_id, target_technique_id, target_spell_id) = 1',
)
@Unique([
  'linkType',
  'ownerTraining',
  'ownerTalent',
  'ownerTechnique',
  'ownerSpell',
  'targetTraining',
  'targetTalent',
  'targetTechnique',
  'targetSpell',
])
export class EntityLink extends BaseEntity {
  @Column({ type: 'enum', enum: EntityLinkType, name: 'link_type' })
  linkType!: EntityLinkType;

  @ManyToOne(() => Training, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_training_id' })
  ownerTraining!: Training | null;

  @ManyToOne(() => Talent, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_talent_id' })
  ownerTalent!: Talent | null;

  @ManyToOne(() => Technique, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_technique_id' })
  ownerTechnique!: Technique | null;

  @ManyToOne(() => Spell, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_spell_id' })
  ownerSpell!: Spell | null;

  @ManyToOne(() => Training, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_training_id' })
  targetTraining!: Training | null;

  @ManyToOne(() => Talent, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_talent_id' })
  targetTalent!: Talent | null;

  @ManyToOne(() => Technique, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_technique_id' })
  targetTechnique!: Technique | null;

  @ManyToOne(() => Spell, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_spell_id' })
  targetSpell!: Spell | null;
}
