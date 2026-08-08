import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Armor } from './armor.entity';

@Entity('armor_tags')
@Unique(['armor', 'tag'])
export class ArmorTag extends BaseEntity {
  @ApiProperty({
    description: 'Posição da tag na ordem de inserção',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Armor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'armor_id' })
  armor!: Armor;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
