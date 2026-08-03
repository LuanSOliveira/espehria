import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ImprovementFlawType } from '../../improvement-flaw-types/entities/improvement-flaw-type.entity';

@Entity('improvement_flaw_properties')
export class ImprovementFlawProperty extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({
    type: () => [ImprovementFlawType],
    description:
      'Tipos de melhoria/defeito aos quais esta propriedade pertence',
  })
  @ManyToMany(() => ImprovementFlawType)
  @JoinTable({
    name: 'improvement_flaw_property_types',
    joinColumn: { name: 'property_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'type_id', referencedColumnName: 'id' },
  })
  types!: ImprovementFlawType[];
}
