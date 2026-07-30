import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { ConditionSection } from './condition-section.entity';

@Entity('conditions')
export class Condition extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à condição',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'condition_tags',
    joinColumn: { name: 'condition_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ApiProperty({
    type: () => [ConditionSection],
    description: 'Seções da condição',
  })
  @OneToMany(() => ConditionSection, (section) => section.condition, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  sections!: ConditionSection[];
}
