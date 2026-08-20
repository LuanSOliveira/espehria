import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Race } from '../../races/entities/race.entity';
import { Biography } from '../../biographies/entities/biography.entity';
import { Attribute } from '../../attributes/entities/attribute.entity';
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

  @ApiPropertyOptional({
    description: 'PV atual da ficha (número inteiro, aceita negativos)',
    example: 12,
  })
  @Column({ type: 'int', nullable: true, name: 'current_hit_points' })
  currentHitPoints!: number | null;

  @ApiPropertyOptional({
    description: 'PV temporário da ficha (número inteiro, aceita negativos)',
    example: 5,
  })
  @Column({ type: 'int', nullable: true, name: 'temporary_hit_points' })
  temporaryHitPoints!: number | null;

  @ApiProperty({
    description:
      'Quantidade de Peças de Cobre (PC) da ficha (número inteiro, maior ou igual a 0)',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  pc!: number;

  @ApiProperty({
    description:
      'Quantidade de Peças de Prata (PP) da ficha (número inteiro, maior ou igual a 0)',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  pp!: number;

  @ApiProperty({
    description:
      'Quantidade de Peças de Ouro (PO) da ficha (número inteiro, maior ou igual a 0)',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  po!: number;

  @ApiProperty({
    description:
      'Quantidade de Peças de Platina (PL) da ficha (número inteiro, maior ou igual a 0)',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  pl!: number;

  @ApiProperty({
    description: 'Volume Carregado da ficha (número inteiro, maior ou igual a 0)',
    example: 0,
  })
  @Column({ type: 'int', default: 0, name: 'loaded_volume' })
  loadedVolume!: number;

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

  @ApiProperty({
    type: () => Attribute,
    description:
      'Atributo chave selecionado para a Classe de Armadura (10 + modificador deste atributo é a Classe de Armadura base, calculada no client)',
  })
  @ManyToOne(() => Attribute, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'armor_class_key_attribute_id' })
  armorClassKeyAttribute!: Attribute;

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
