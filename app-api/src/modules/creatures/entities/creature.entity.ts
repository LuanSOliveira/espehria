import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CreatureCategory } from './creature-category.entity';

@Entity('creatures')
export class Creature extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({ type: () => CreatureCategory })
  @ManyToOne(() => CreatureCategory, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: CreatureCategory;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image_url' })
  referenceImageUrl!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'other_names' })
  otherNames!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'threat_level' })
  threatLevel!: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'average_life_expectancy',
  })
  averageLifeExpectancy!: string | null;

  @Column({
    type: 'text',
    nullable: true,
    name: 'physical_characteristics',
  })
  physicalCharacteristics!: string | null;

  @Column({ type: 'text', nullable: true })
  habitat!: string | null;

  @Column({ type: 'text', nullable: true })
  behavior!: string | null;

  @Column({ type: 'text', nullable: true })
  diet!: string | null;

  @Column({ type: 'text', nullable: true, name: 'life_cycle' })
  lifeCycle!: string | null;

  @Column({ type: 'text', nullable: true, name: 'life_stage_infant' })
  lifeStageInfant!: string | null;

  @Column({ type: 'text', nullable: true, name: 'life_stage_young' })
  lifeStageYoung!: string | null;

  @Column({ type: 'text', nullable: true, name: 'life_stage_adult' })
  lifeStageAdult!: string | null;

  @Column({ type: 'text', nullable: true, name: 'life_stage_elder' })
  lifeStageElder!: string | null;

  @Column({ type: 'text', nullable: true, name: 'abilities_and_powers' })
  abilitiesAndPowers!: string | null;

  @Column({ type: 'text', nullable: true })
  resistances!: string | null;

  @Column({ type: 'text', nullable: true })
  weaknesses!: string | null;

  @Column({ type: 'text', nullable: true })
  combat!: string | null;

  @Column({ type: 'text', nullable: true, name: 'attack_methods' })
  attackMethods!: string | null;

  @Column({ type: 'text', nullable: true })
  strategy!: string | null;

  @Column({ type: 'text', nullable: true, name: 'danger_degree' })
  dangerDegree!: string | null;

  @Column({ type: 'text', nullable: true, name: 'obtained_resources' })
  obtainedResources!: string | null;

  @Column({ type: 'text', nullable: true, name: 'commercial_value' })
  commercialValue!: string | null;

  @Column({
    type: 'text',
    nullable: true,
    name: 'relation_with_civilizations',
  })
  relationWithCivilizations!: string | null;

  @Column({ type: 'text', nullable: true, name: 'mythology_and_folklore' })
  mythologyAndFolklore!: string | null;

  @Column({ type: 'text', nullable: true, name: 'encounter_record' })
  encounterRecord!: string | null;

  @Column({ type: 'text', nullable: true, name: 'scholars_curiosity' })
  scholarsCuriosity!: string | null;
}
