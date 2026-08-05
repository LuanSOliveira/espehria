import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { LocationSection } from './location-section.entity';

@Entity('locations')
export class Location extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  type!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image_url' })
  referenceImageUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty({ type: () => [Tag], description: 'Tags associadas ao local' })
  tags!: Tag[];

  @ManyToMany(() => Location, (location) => location.pointsOfInterestOf)
  @JoinTable({
    name: 'location_points_of_interest',
    joinColumn: { name: 'location_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'point_of_interest_id',
      referencedColumnName: 'id',
    },
  })
  pointsOfInterest!: Location[];

  @ManyToMany(() => Location, (location) => location.pointsOfInterest)
  pointsOfInterestOf!: Location[];

  @ApiProperty({
    type: () => [LocationSection],
    description: 'Seções do local',
  })
  @OneToMany(() => LocationSection, (section) => section.location, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  sections!: LocationSection[];
}
