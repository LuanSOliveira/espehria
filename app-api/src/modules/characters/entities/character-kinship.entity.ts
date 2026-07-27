import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Character } from './character.entity';

@Entity('character_kinships')
@Unique(['character', 'relative'])
export class CharacterKinship extends BaseEntity {
  @ApiProperty({
    description: 'Grau ou tipo de parentesco (texto livre)',
    example: 'Pai',
  })
  @Column()
  kinship!: string;

  @ManyToOne(() => Character, (character) => character.kinships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'character_id' })
  character!: Character;

  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relative_id' })
  relative!: Character;
}
