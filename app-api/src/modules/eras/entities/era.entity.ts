import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
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

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty({ type: () => [Tag], description: 'Tags associadas à era' })
  tags!: Tag[];

  @ApiProperty({
    description:
      'Posição de ordenação da era (mapeada para a coluna "ordering")',
  })
  @Column({ type: 'int', name: 'ordering' })
  order!: number;
}
