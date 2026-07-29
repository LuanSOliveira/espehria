import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Character } from '../../characters/entities/character.entity';
import { FamilyRelationshipType } from '../enums/family-relationship-type.enum';
import { Family } from './family.entity';

@Entity('family_relationships')
@Unique(['family', 'sourceCharacter', 'targetCharacter'])
export class FamilyRelationship extends BaseEntity {
  @ApiProperty({ enum: FamilyRelationshipType })
  @Column({ type: 'enum', enum: FamilyRelationshipType })
  type!: FamilyRelationshipType;

  @ManyToOne(() => Family, (family) => family.relationships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'family_id' })
  family!: Family;

  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_character_id' })
  sourceCharacter!: Character;

  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_character_id' })
  targetCharacter!: Character;
}
