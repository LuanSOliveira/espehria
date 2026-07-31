import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PlannedSession } from './planned-session.entity';

@Entity('planned_session_sections')
export class PlannedSessionSection extends BaseEntity {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Resumo da Sessão',
  })
  @Column()
  label!: string;

  @ApiPropertyOptional({
    description: 'Descrição da seção (suporta HTML)',
    example: '<p>Conteúdo da descrição da seção</p>',
  })
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    description: 'Posição da seção na sequência de adição',
    example: 0,
  })
  @Column({ type: 'int' })
  order!: number;

  @ManyToOne(
    () => PlannedSession,
    (plannedSession) => plannedSession.sections,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'planned_session_id' })
  plannedSession!: PlannedSession;
}
