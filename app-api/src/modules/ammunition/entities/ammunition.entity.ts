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
import { Tag } from '../../tags/entities/tag.entity';
import { Currency } from '../../currencies/entities/currency.entity';

@Entity('ammunition')
export class Ammunition extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer', nullable: true })
  price!: number | null;

  @ManyToOne(() => Currency, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency | null;

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas ao item de munição',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'ammunition_tags',
    joinColumn: { name: 'ammunition_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];
}
