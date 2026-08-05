import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('proficiency_properties')
export class ProficiencyProperty extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;
}
