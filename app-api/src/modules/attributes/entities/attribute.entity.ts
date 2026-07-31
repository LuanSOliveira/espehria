import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('attributes')
export class Attribute extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;
}
