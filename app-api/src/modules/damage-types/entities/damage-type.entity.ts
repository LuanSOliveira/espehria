import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('damage_types')
export class DamageType extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;
}
