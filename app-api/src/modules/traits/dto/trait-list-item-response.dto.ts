import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trait } from '../entities/trait.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { TraitTypeResponseDto } from '../../trait-types/dto/trait-type-response.dto';

export class TraitListItemResponseDto {
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

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao traço',
  })
  tags: TagResponseDto[];

  static fromEntity(trait: Trait): TraitListItemResponseDto {
    const dto = new TraitListItemResponseDto();
    dto.id = trait.id;
    dto.name = trait.name;
    dto.traitType = trait.traitType
      ? TraitTypeResponseDto.fromEntity(trait.traitType)
      : null;
    dto.tags = (trait.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
