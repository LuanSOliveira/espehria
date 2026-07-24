import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('divinity_categories')
export class DivinityCategory extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;
}
