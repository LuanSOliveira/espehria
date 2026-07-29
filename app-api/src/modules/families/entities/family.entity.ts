import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { FamilyClassification } from '../enums/family-classification.enum';
import { FamilyMember } from './family-member.entity';
import { FamilyRelationship } from './family-relationship.entity';

@Entity('families')
export class Family extends BaseEntity {
  @ApiProperty()
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({ enum: FamilyClassification })
  @Column({ type: 'enum', enum: FamilyClassification })
  classification!: FamilyClassification;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à família',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'family_tags',
    joinColumn: { name: 'family_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ApiProperty({
    type: () => [FamilyMember],
    description: 'Membros posicionados na árvore genealógica da família',
  })
  @OneToMany(() => FamilyMember, (member) => member.family, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  members!: FamilyMember[];

  @ApiProperty({
    type: () => [FamilyRelationship],
    description: 'Vínculos de parentesco entre os membros da árvore genealógica',
  })
  @OneToMany(() => FamilyRelationship, (relationship) => relationship.family, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  relationships!: FamilyRelationship[];
}
