import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trait } from '../entities/trait.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { TraitTypeResponseDto } from '../../trait-types/dto/trait-type-response.dto';

export class TraitResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do traço',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do traço',
    example: 'Perfurante',
  })
  name: string;

  @ApiPropertyOptional({
    type: () => TraitTypeResponseDto,
    description: 'Tipo do traço (Arma ou Armadura)',
  })
  traitType: TraitTypeResponseDto | null;

  @ApiPropertyOptional({
    description: 'Descrição do traço em HTML',
    example: '<p>Ignora parte da resistência do alvo</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao traço, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(trait: Trait): TraitResponseDto {
    const dto = new TraitResponseDto();
    dto.id = trait.id;
    dto.name = trait.name;
    dto.traitType = trait.traitType
      ? TraitTypeResponseDto.fromEntity(trait.traitType)
      : null;
    dto.description = trait.description;
    dto.tags = (trait.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.createdAt = trait.createdAt;
    dto.updatedAt = trait.updatedAt;
    return dto;
  }
}
