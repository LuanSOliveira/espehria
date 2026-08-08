import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Accessory } from './accessory.entity';

@Entity('accessory_tags')
@Unique(['accessory', 'tag'])
export class AccessoryTag extends BaseEntity {
  @ApiProperty({
    description: 'Posição da tag na ordem de inserção',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Accessory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accessory_id' })
  accessory!: Accessory;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
