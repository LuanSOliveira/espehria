import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Skill } from './skill.entity';

@Entity('skill_sections')
export class SkillSection extends BaseEntity {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Usos Comuns',
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

  @ManyToOne(() => Skill, (skill) => skill.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'skill_id' })
  skill!: Skill;
}
