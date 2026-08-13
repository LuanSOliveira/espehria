import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Trait } from '../../traits/entities/trait.entity';
import { Weapon } from './weapon.entity';

@Entity('weapon_traits')
@Unique(['weapon', 'trait'])
export class WeaponTrait extends BaseEntity {
  @ApiProperty({
    description: 'Posição do traço na ordem de inserção',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Weapon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'weapon_id' })
  weapon!: Weapon;

  @ManyToOne(() => Trait, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trait_id' })
  trait!: Trait;
}
