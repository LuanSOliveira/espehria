import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { OrganizationMember } from './organization-member.entity';

@Entity('organizations')
export class Organization extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à organização',
  })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'organization_tags',
    joinColumn: { name: 'organization_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @ApiProperty({
    type: () => [OrganizationMember],
    description: 'Membros da organização',
  })
  @OneToMany(() => OrganizationMember, (member) => member.organization, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  members!: OrganizationMember[];
}
