import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Currency } from '../../currencies/entities/currency.entity';
import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto';
import type { EmbeddedEffect } from '../../../common/interfaces/embedded-effect.interface';

@Entity('accessories')
export class Accessory extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'reference_image' })
  referenceImage!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer', nullable: true })
  price!: number | null;

  @ManyToOne(() => Currency, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency | null;

  @Column({ type: 'text', nullable: true, name: 'private_information' })
  privateInformation!: string | null;

  @ApiProperty({
    type: () => [Tag],
    description: 'Tags associadas ao acessório',
  })
  tags!: Tag[];

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Encantamentos do acessório (cópia de nome/efeito, sem vínculo/FK com o catálogo de Encantamentos)',
  })
  @Column({ type: 'jsonb', default: [] })
  enchantments!: EmbeddedEffect[];

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Aprimoramentos do acessório (cópia de nome/efeito, sem vínculo/FK com o catálogo de Aprimoramentos)',
  })
  @Column({ type: 'jsonb', default: [] })
  enhancements!: EmbeddedEffect[];
}
