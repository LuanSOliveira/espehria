import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  // Unicidade de (name, type) é garantida por um índice único de expressão
  // (name, COALESCE(type, '')) criado via SQL puro na migration
  // ChangeTagsUniqueIndexToNameAndType — não representável via @Index do TypeORM,
  // que não suporta índices sobre expressões arbitrárias. Não recriar esse índice
  // via decorator aqui.
  @ApiProperty()
  @Column()
  name!: string;

  @ApiProperty()
  @Column()
  color!: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  type!: string | null;
}
