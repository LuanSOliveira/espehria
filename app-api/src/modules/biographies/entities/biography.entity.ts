import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('biographies')
export class Biography extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'image_reference' })
  imageReference!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à biografia',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'biography_tags',
    joinColumn: { name: 'biography_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];
}
