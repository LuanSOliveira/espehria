import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DivinityCategory } from './divinity-category.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('divinities')
export class Divinity extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @ApiProperty({ type: () => DivinityCategory })
  @ManyToOne(() => DivinityCategory, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category!: DivinityCategory;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  titles!: string | null;

  @Column({ type: 'varchar', nullable: true })
  alignment!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'domain_sphere' })
  domainSphere!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'primary_element' })
  primaryElement!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'sacred_symbol' })
  sacredSymbol!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'sacred_animal' })
  sacredAnimal!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'sacred_color' })
  sacredColor!: string | null;

  @Column({ type: 'text', nullable: true })
  personality!: string | null;

  @Column({ type: 'text', nullable: true, name: 'divine_domains' })
  divineDomains!: string | null;

  @Column({ type: 'text', nullable: true })
  powers!: string | null;

  @Column({ type: 'text', nullable: true, name: 'world_influence' })
  worldInfluence!: string | null;

  @Column({ type: 'text', nullable: true, name: 'divine_appearance' })
  divineAppearance!: string | null;

  @Column({ type: 'text', nullable: true })
  avatars!: string | null;

  @Column({ type: 'text', nullable: true })
  church!: string | null;

  @Column({ type: 'text', nullable: true })
  cult!: string | null;

  @Column({ type: 'text', nullable: true })
  blessings!: string | null;

  @Column({ type: 'text', nullable: true })
  curses!: string | null;

  @Column({ type: 'text', nullable: true })
  legends!: string | null;

  @Column({ type: 'text', nullable: true })
  commandments!: string | null;

  @Column({ type: 'text', nullable: true })
  oaths!: string | null;

  @Column({ type: 'text', nullable: true })
  curiosities!: string | null;

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas à divindade',
  })
  tags!: Tag[];
}
