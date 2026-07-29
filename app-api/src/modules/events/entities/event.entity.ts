import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Era } from '../../eras/entities/era.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('events')
export class Event extends BaseEntity {
  @ApiProperty()
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image_url' })
  referenceImageUrl!: string | null;

  @Column({ type: 'int', nullable: true, name: 'start_year' })
  startYear!: number | null;

  @Column({ type: 'int', nullable: true, name: 'end_year' })
  endYear!: number | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty({ type: () => [Tag], description: 'Tags associadas ao evento' })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'event_tags',
    joinColumn: { name: 'event_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ApiProperty({ type: () => Era, description: 'Era vinculada ao evento' })
  @ManyToOne(() => Era, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'era_id' })
  era!: Era | null;
}
