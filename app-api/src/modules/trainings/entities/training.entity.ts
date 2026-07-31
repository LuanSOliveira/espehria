import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('trainings')
export class Training extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas ao treinamento',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'training_tags',
    joinColumn: { name: 'training_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];
}
