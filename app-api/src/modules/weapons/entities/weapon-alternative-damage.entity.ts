import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DamageType } from '../../damage-types/entities/damage-type.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { WeaponDamageDie } from '../enums/weapon-damage-die.enum';
import { Weapon } from './weapon.entity';

@Entity('weapon_alternative_damages')
export class WeaponAlternativeDamage extends BaseEntity {
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

  @Column({ type: 'int', name: 'reload_actions', nullable: true })
  reloadActions!: number | null;

  @Column({ type: 'boolean', name: 'uses_ammunition', default: false })
  usesAmmunition!: boolean;

  @Column({ type: 'int' })
  order!: number;

  @ManyToOne(() => Weapon, (weapon) => weapon.alternativeDamages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'weapon_id' })
  weapon!: Weapon;
}
