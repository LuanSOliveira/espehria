import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Attribute } from '../../attributes/entities/attribute.entity';
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

  @ApiProperty({ type: () => Attribute })
  @ManyToOne(() => Attribute, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'key_attribute_id' })
  keyAttribute!: Attribute;

  @ApiProperty({ type: () => [Tag], description: 'Tags associadas à perícia' })
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
