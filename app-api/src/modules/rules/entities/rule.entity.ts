import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RuleSection } from './rule-section.entity';

@Entity('rules')
export class Rule extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    type: () => [RuleSection],
    description: 'Seções da regra',
  })
  @OneToMany(() => RuleSection, (section) => section.rule, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  sections!: RuleSection[];
}
