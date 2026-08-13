import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { TraitType } from '../../trait-types/entities/trait-type.entity';

@Entity('traits')
export class Trait extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ManyToOne(() => TraitType, { nullable: true })
  @JoinColumn({ name: 'trait_type_id' })
  traitType!: TraitType | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas ao traço',
  })
  tags!: Tag[];
}
