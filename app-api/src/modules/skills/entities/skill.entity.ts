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
import { SkillSection } from './skill-section.entity';

@Entity('skills')
export class Skill extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({ type: () => [Tag], description: 'Tags associadas à perícia' })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'skill_tags',
    joinColumn: { name: 'skill_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ApiProperty({
    type: () => [SkillSection],
    description: 'Seções da perícia',
  })
  @OneToMany(() => SkillSection, (section) => section.skill, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  sections!: SkillSection[];
}
