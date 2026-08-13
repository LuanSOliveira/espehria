import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Currency } from '../../currencies/entities/currency.entity';
import { SizeGrade } from '../../size-grades/entities/size-grade.entity';
import { DamageType } from '../../damage-types/entities/damage-type.entity';
import { Trait } from '../../traits/entities/trait.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { WeaponHands } from '../enums/weapon-hands.enum';
import { WeaponStyle } from '../enums/weapon-style.enum';
import { WeaponDamageDie } from '../enums/weapon-damage-die.enum';

@Entity('weapons')
export class Weapon extends BaseEntity {
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
    description: 'Tags associadas à arma',
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

  @ManyToOne(() => SizeGrade, { nullable: true })
  @JoinColumn({ name: 'size_grade_id' })
  sizeGrade!: SizeGrade | null;

  @Column({ type: 'enum', enum: WeaponHands, nullable: true })
  hands!: WeaponHands | null;

  @Column({
    type: 'enum',
    enum: WeaponStyle,
    name: 'weapon_style',
    nullable: true,
  })
  weaponStyle!: WeaponStyle | null;

  @ApiProperty({
    type: () => [Trait],
    description: 'Traços associados à arma',
  })
  traits!: Trait[];

  @Column({ type: 'int', name: 'damage_value', nullable: true })
  damageValue!: number | null;

  @Column({
    type: 'enum',
    enum: WeaponDamageDie,
    name: 'damage_die',
    nullable: true,
  })
  damageDie!: WeaponDamageDie | null;

  @ManyToOne(() => DamageType, { nullable: true })
  @JoinColumn({ name: 'damage_type_id' })
  damageType!: DamageType | null;

  @Column({ type: 'boolean', name: 'magical_damage', default: false })
  magicalDamage!: boolean;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    name: 'distance_meters',
    nullable: true,
    transformer: DecimalTransformer,
  })
  distanceMeters!: number | null;

  @Column({ type: 'boolean', name: 'uses_ammunition', default: false })
  usesAmmunition!: boolean;

  @Column({ type: 'int', name: 'reload_actions', nullable: true })
  reloadActions!: number | null;
}
