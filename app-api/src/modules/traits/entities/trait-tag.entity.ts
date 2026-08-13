import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Trait } from './trait.entity';

@Entity('trait_tags')
@Unique(['trait', 'tag'])
export class TraitTag extends BaseEntity {
  @ApiProperty({
    description: 'Posição da tag na ordem de inserção',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Trait, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trait_id' })
  trait!: Trait;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
