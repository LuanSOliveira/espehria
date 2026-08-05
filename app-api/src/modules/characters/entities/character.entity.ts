import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Race } from '../../races/entities/race.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Family } from '../../families/entities/family.entity';

@Entity('characters')
export class Character extends BaseEntity {
  @ApiProperty()
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty()
  @Column({ type: 'boolean', default: false, name: 'is_dead' })
  isDead!: boolean;

  @ApiPropertyOptional({ type: () => Race })
  @ManyToOne(() => Race, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'race_id' })
  race!: Race | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas ao personagem',
  })
  tags!: Tag[];

  @ApiPropertyOptional({ type: () => Family })
  @ManyToOne(() => Family, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'family_id' })
  family!: Family | null;

  @ApiPropertyOptional({ type: () => Family })
  @ManyToOne(() => Family, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'secondary_family_id' })
  secondaryFamily!: Family | null;
}
