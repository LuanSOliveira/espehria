import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ImprovementFlawType } from '../../improvement-flaw-types/entities/improvement-flaw-type.entity';

@Entity('improvement_flaw_properties')
export class ImprovementFlawProperty extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ManyToOne(() => ImprovementFlawType, { nullable: false })
  @JoinColumn({ name: 'type_id' })
  type!: ImprovementFlawType;
}
