import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Character } from '../../characters/entities/character.entity';
import { Family } from './family.entity';

@Entity('family_members')
@Unique(['family', 'character'])
export class FamilyMember extends BaseEntity {
  @ApiProperty({
    description: 'Posição X do card no quadro da árvore genealógica',
    example: 120,
  })
  @Column({ type: 'double precision', name: 'position_x' })
  positionX!: number;

  @ApiProperty({
    description: 'Posição Y do card no quadro da árvore genealógica',
    example: 80,
  })
  @Column({ type: 'double precision', name: 'position_y' })
  positionY!: number;

  @ManyToOne(() => Family, (family) => family.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'family_id' })
  family!: Family;

  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'character_id' })
  character!: Character;
}
