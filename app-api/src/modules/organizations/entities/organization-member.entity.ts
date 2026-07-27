import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Character } from '../../characters/entities/character.entity';
import { Organization } from './organization.entity';

@Entity('organization_members')
@Unique(['organization', 'character'])
export class OrganizationMember extends BaseEntity {
  @ApiProperty({
    description: 'Função exercida na organização (texto livre)',
    example: 'Líder',
  })
  @Column()
  role!: string;

  @ManyToOne(() => Organization, (organization) => organization.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'character_id' })
  character!: Character;
}
