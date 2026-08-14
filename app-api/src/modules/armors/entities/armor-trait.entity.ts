import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Trait } from '../../traits/entities/trait.entity';
import { Armor } from './armor.entity';

@Entity('armor_traits')
@Unique(['armor', 'trait'])
export class ArmorTrait extends BaseEntity {
  @ApiProperty({
    description: 'Posição do traço na ordem de inserção',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Armor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'armor_id' })
  armor!: Armor;

  @ManyToOne(() => Trait, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trait_id' })
  trait!: Trait;
}
