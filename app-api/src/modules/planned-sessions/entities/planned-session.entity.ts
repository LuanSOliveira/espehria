import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { PlannedSessionSection } from './planned-session-section.entity';

@Entity('planned_sessions')
export class PlannedSession extends BaseEntity {
  @ApiProperty({
    description: 'Nome da sessão planejada',
    example: 'Sessão 1 - A Chegada a Valgrim',
  })
  @Column()
  name!: string;

  @ApiPropertyOptional({
    description: 'Introdução da sessão planejada (suporta HTML)',
    example:
      '<p>Os aventureiros chegam às portas de Valgrim ao entardecer.</p>',
  })
  @Column({ type: 'text', nullable: true })
  introduction!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à sessão planejada',
  })
  tags!: Tag[];

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @ApiProperty({
    type: () => [PlannedSessionSection],
    description: 'Seções da sessão planejada',
  })
  @OneToMany(() => PlannedSessionSection, (section) => section.plannedSession, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  sections!: PlannedSessionSection[];
}
