import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from './campaign.entity';

@Entity('campaign_sections')
export class CampaignSection extends BaseEntity {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Ganchos de Aventura',
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

  @ManyToOne(() => Campaign, (campaign) => campaign.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;
}
