import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EnhancementType } from '../enums/enhancement-type.enum';

@Entity('enhancements')
export class Enhancement extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'enum', enum: EnhancementType, nullable: true })
  type!: EnhancementType | null;

  @Column({ type: 'text', nullable: true })
  effect!: string | null;
}
