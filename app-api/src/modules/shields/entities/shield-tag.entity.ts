import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Shield } from './shield.entity';

@Entity('shield_tags')
@Unique(['shield', 'tag'])
export class ShieldTag extends BaseEntity {
  @ApiProperty({
    description: 'Posição da tag na ordem de inserção',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Shield, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shield_id' })
  shield!: Shield;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
