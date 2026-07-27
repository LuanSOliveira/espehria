import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Race } from '../../races/entities/race.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { CharacterKinship } from './character-kinship.entity';

@Entity('characters')
export class Character extends BaseEntity {
  @ApiProperty()
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty()
  @Column({ type: 'boolean', default: false, name: 'is_dead' })
  isDead!: boolean;

  @ApiPropertyOptional({ type: () => Race })
  @ManyToOne(() => Race, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'race_id' })
  race!: Race | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas ao personagem',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'character_tags',
    joinColumn: { name: 'character_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ApiProperty({
    type: () => [CharacterKinship],
    description: 'Parentescos do personagem',
  })
  @OneToMany(() => CharacterKinship, (kinship) => kinship.character, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  kinships!: CharacterKinship[];
}
