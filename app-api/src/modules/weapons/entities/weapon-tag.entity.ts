import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Weapon } from './weapon.entity';

@Entity('weapon_tags')
@Unique(['weapon', 'tag'])
export class WeaponTag extends BaseEntity {
  @ApiProperty({
    description: 'Posição da tag na ordem de inserção',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Weapon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'weapon_id' })
  weapon!: Weapon;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
