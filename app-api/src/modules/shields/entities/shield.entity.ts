import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Currency } from '../../currencies/entities/currency.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto';
import type { EmbeddedEffect } from '../../../common/interfaces/embedded-effect.interface';

@Entity('shields')
export class Shield extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer', nullable: true })
  price!: number | null;

  @ManyToOne(() => Currency, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency | null;

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas ao escudo',
  })
  tags!: Tag[];

  @Column({ type: 'varchar', nullable: true })
  nickname!: string | null;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: DecimalTransformer,
  })
  volume!: number | null;

  @Column({ type: 'int', name: 'armor_class_bonus', nullable: true })
  armorClassBonus!: number | null;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    name: 'speed_penalty_meters',
    nullable: true,
    transformer: DecimalTransformer,
  })
  speedPenaltyMeters!: number | null;

  @Column({ type: 'int', nullable: true })
  hardness!: number | null;

  @Column({ type: 'int', name: 'hit_points', nullable: true })
  hitPoints!: number | null;

  @Column({ type: 'int', name: 'break_threshold', default: 0 })
  breakThreshold!: number;

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Encantamentos do escudo (cópia de nome/efeito, sem vínculo/FK com o catálogo de Encantamentos)',
  })
  @Column({ type: 'jsonb', default: [] })
  enchantments!: EmbeddedEffect[];

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Aprimoramentos do escudo (cópia de nome/efeito, sem vínculo/FK com o catálogo de Aprimoramentos)',
  })
  @Column({ type: 'jsonb', default: [] })
  enhancements!: EmbeddedEffect[];
}
