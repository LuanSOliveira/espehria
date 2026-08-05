import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { PlannedSession } from './planned-session.entity';

@Entity('planned_session_tags')
@Unique(['plannedSession', 'tag'])
export class PlannedSessionTag extends BaseEntity {
  @ApiProperty({
    description: 'Posição da tag na ordem de inserção',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => PlannedSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planned_session_id' })
  plannedSession!: PlannedSession;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
