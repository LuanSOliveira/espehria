import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('characteristics')
export class Characteristic extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({
    description: 'Nível da característica (obrigatório)',
    example: 3,
  })
  @Column({ type: 'int' })
  level!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à característica',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'characteristic_tags',
    joinColumn: { name: 'characteristic_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];
}
