import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Rule } from './rule.entity';

@Entity('rule_sections')
export class RuleSection extends BaseEntity {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Iniciativa',
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

  @ManyToOne(() => Rule, (rule) => rule.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rule_id' })
  rule!: Rule;
}
