import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { User } from '../../users/entities/user.entity';
import { CampaignSection } from './campaign-section.entity';

@Entity('campaigns')
@Index(['name', 'createdBy'], { unique: true })
export class Campaign extends BaseEntity {
  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da campanha',
    example: 'https://exemplo.com/campanha.jpg',
  })
  @Column({ type: 'varchar', nullable: true, name: 'reference_image_url' })
  referenceImageUrl!: string | null;

  @ApiProperty({
    description: 'Nome da campanha (único por usuário)',
    example: 'A Sombra de Valgrim',
  })
  @Column()
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição da campanha (suporta HTML)',
    example: '<p>Uma campanha ambientada nas terras esquecidas de Valgrim.</p>',
  })
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à campanha',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'campaign_tags',
    joinColumn: { name: 'campaign_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @ApiProperty({
    type: () => [User],
    description:
      'Usuários Google autorizados a visualizar esta campanha no contexto de fichas',
  })
  @ManyToMany(() => User)
  @JoinTable({
    name: 'campaign_allowed_users',
    joinColumn: { name: 'campaign_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  allowedUsers!: User[];

  @ApiProperty({
    type: () => [CampaignSection],
    description: 'Seções da campanha',
  })
  @OneToMany(() => CampaignSection, (section) => section.campaign, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  sections!: CampaignSection[];
}
