import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('currencies')
export class Currency extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  abbreviation!: string;

  @ApiProperty()
  @Column()
  name!: string;
}
