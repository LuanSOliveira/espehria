import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';

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

  @ApiProperty({ type: () => [Tag], description: 'Tags associadas ao local' })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'location_tags',
    joinColumn: { name: 'location_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
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
}
