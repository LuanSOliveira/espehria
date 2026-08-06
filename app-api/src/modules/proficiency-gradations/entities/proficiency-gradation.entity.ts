import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('proficiency_gradations')
export class ProficiencyGradation extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({
    description:
      'Nível de magnitude da graduação, usado para comparar proficiências entre si (não é a ordem de exibição dos cards)',
  })
  @Index({ unique: true })
  @Column({ type: 'int' })
  level!: number;

  @ApiProperty({
    description:
      'Valor numérico somado ao modificador do atributo-chave no cálculo de perícia da ficha. Diferente de `level`, que serve apenas para comparar graduações entre si',
  })
  @Column({ type: 'int' })
  bonus!: number;
}
