import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DivinityCategory } from './divinity-category.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('divinities')
export class Divinity extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({ type: () => DivinityCategory })
  @ManyToOne(() => DivinityCategory, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category!: DivinityCategory;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à divindade',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'divinity_tags',
    joinColumn: { name: 'divinity_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];
}
