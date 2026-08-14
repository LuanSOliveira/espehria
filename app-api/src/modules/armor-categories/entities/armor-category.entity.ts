import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('armor_categories')
export class ArmorCategory extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({
    description:
      'Posição de exibição da categoria de armadura (ordem crescente, não indica magnitude comparável fora da listagem)',
  })
  @Index({ unique: true })
  @Column({ type: 'int' })
  order!: number;
}
