import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Race } from '../../races/entities/race.entity';
import { Biography } from '../../biographies/entities/biography.entity';
import { User } from '../../users/entities/user.entity';
import type { SheetImprovementFlawSnapshot } from '../interfaces/sheet-improvement-flaw-snapshot.interface';
import type { SheetProficiencySnapshot } from '../interfaces/sheet-proficiency-snapshot.interface';
import type { SheetProficiencyAdjustment } from '../interfaces/sheet-proficiency-adjustment.interface';
import type { SheetKnowledgeSnapshot } from '../interfaces/sheet-knowledge-snapshot.interface';

@Entity('sheets')
export class Sheet extends BaseEntity {
  @ApiProperty({
    description: 'Nome da ficha (obrigatório, não único)',
    example: 'Aragorn',
  })
  @Column()
  name!: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da ficha',
    example: 'https://exemplo.com/ficha.jpg',
  })
  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @ApiProperty({
    description:
      'Nível da ficha (número inteiro, mínimo 1, fixado em 1 na criação)',
    example: 1,
  })
  @Column({ type: 'int', default: 1 })
  level!: number;

  @ApiPropertyOptional({ type: () => Campaign })
  @ManyToOne(() => Campaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign | null;

  @ApiPropertyOptional({ type: () => Race })
  @ManyToOne(() => Race, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'race_id' })
  race!: Race | null;

  @ApiPropertyOptional({ type: () => Biography })
  @ManyToOne(() => Biography, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'biography_id' })
  biography!: Biography | null;

  @Column({
    type: 'jsonb',
    default: {
      race: [],
      biography: [],
      trainings: [],
      talents: [],
      characteristics: [],
    },
  })
  melhorias!: SheetImprovementFlawSnapshot;

  @Column({
    type: 'jsonb',
    default: {
      race: [],
      biography: [],
      trainings: [],
      talents: [],
      characteristics: [],
    },
  })
  defeitos!: SheetImprovementFlawSnapshot;

  @Column({
    type: 'jsonb',
    default: {
      race: [],
      biography: [],
      trainings: [],
      talents: [],
      characteristics: [],
    },
  })
  proficiencias!: SheetProficiencySnapshot;

  @Column({
    type: 'jsonb',
    default: [],
    name: 'proficiencias_ajustadas',
  })
  proficienciasAjustadas!: SheetProficiencyAdjustment[];

  @Column({
    type: 'jsonb',
    default: {
      race: [],
      biography: [],
      trainings: [],
      talents: [],
      characteristics: [],
    },
  })
  saberes!: SheetKnowledgeSnapshot;

  @Column({ type: 'jsonb', default: {}, name: 'saberes_anotacoes' })
  saberesAnotacoes!: Record<string, string>;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;
}
