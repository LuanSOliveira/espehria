import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Currency } from '../../currencies/entities/currency.entity';
import { ArmorCategory } from '../../armor-categories/entities/armor-category.entity';
import { Trait } from '../../traits/entities/trait.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('armors')
export class Armor extends BaseEntity {
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
    description: 'Tags associadas à armadura',
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

  @ManyToOne(() => ArmorCategory, { nullable: true })
  @JoinColumn({ name: 'armor_category_id' })
  armorCategory!: ArmorCategory | null;

  @Column({ type: 'int', name: 'armor_class_bonus', nullable: true })
  armorClassBonus!: number | null;

  @Column({ type: 'int', name: 'dexterity_modifier_limit', nullable: true })
  dexterityModifierLimit!: number | null;

  @Column({ type: 'int', nullable: true })
  strength!: number | null;

  @Column({ type: 'int', name: 'check_penalty', nullable: true })
  checkPenalty!: number | null;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    name: 'speed_penalty_meters',
    nullable: true,
    transformer: DecimalTransformer,
  })
  speedPenaltyMeters!: number | null;

  @ApiProperty({
    type: () => [Trait],
    description: 'Traços associados à armadura',
  })
  traits!: Trait[];
}
