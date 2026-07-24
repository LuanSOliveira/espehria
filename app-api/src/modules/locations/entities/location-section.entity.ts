import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Location } from './location.entity';

@Entity('location_sections')
export class LocationSection extends BaseEntity {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Flora Local',
  })
  @Column()
  label!: string;

  @ApiPropertyOptional({
    description: 'Descrição da seção (HTML)',
    example: '<p>Conteúdo da descrição da seção</p>',
  })
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    description: 'Posição da seção na sequência de adição',
    example: 0,
  })
  @Column({ type: 'int' })
  order!: number;

  @ManyToOne(() => Location, (location) => location.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location!: Location;
}
