import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { EntityReferenceResponseDto } from '../../entity-links/dto/entity-reference-response.dto';

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
  tags!: Tag[];

  // Campo transiente (sem `@Column`), populado em tempo de leitura por
  // `SheetsService` a partir de `entity_links` — mesmo padrão de `tags`.
  additionalAbilities!: EntityReferenceResponseDto[];
}
