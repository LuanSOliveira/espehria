import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EnchantmentType } from '../enums/enchantment-type.enum';

@Entity('enchantments')
export class Enchantment extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'enum', enum: EnchantmentType, nullable: true })
  type!: EnchantmentType | null;

  @Column({ type: 'text', nullable: true })
  effect!: string | null;
}
