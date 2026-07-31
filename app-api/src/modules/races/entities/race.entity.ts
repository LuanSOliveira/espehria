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
import { RaceCategory } from './race-category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Characteristic } from '../../characteristics/entities/characteristic.entity';
import { Talent } from '../../talents/entities/talent.entity';

@Entity('races')
export class Race extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({ type: () => RaceCategory })
  @ManyToOne(() => RaceCategory, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: RaceCategory;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image_url' })
  referenceImageUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty({ type: () => [Tag], description: 'Tags associadas à raça' })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'race_tags',
    joinColumn: { name: 'race_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ApiProperty({
    type: () => [Characteristic],
    description: 'Características associadas à raça',
  })
  @ManyToMany(() => Characteristic)
  @JoinTable({
    name: 'race_characteristics',
    joinColumn: { name: 'race_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'characteristic_id',
      referencedColumnName: 'id',
    },
  })
  characteristics!: Characteristic[];

  @ApiProperty({
    type: () => [Talent],
    description: 'Talentos associados à raça',
  })
  @ManyToMany(() => Talent)
  @JoinTable({
    name: 'race_talents',
    joinColumn: { name: 'race_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'talent_id', referencedColumnName: 'id' },
  })
  talents!: Talent[];
}
