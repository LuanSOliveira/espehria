import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('size_grades')
export class SizeGrade extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({
    description:
      'Posição de exibição do grau de tamanho (ordem crescente, não indica magnitude comparável fora da listagem)',
  })
  @Index({ unique: true })
  @Column({ type: 'int' })
  order!: number;
}
