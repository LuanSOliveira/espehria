import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('eras')
export class Era extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image_url' })
  referenceImageUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({ type: () => [Tag], description: 'Tags associadas à era' })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'era_tags',
    joinColumn: { name: 'era_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ApiProperty({
    description:
      'Posição de ordenação da era (mapeada para a coluna "ordering")',
  })
  @Column({ type: 'int', name: 'ordering' })
  order!: number;
}
