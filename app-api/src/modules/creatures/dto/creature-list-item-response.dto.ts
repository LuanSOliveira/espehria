import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Creature } from '../entities/creature.entity';
import { CreatureCategoryResponseDto } from './creature-category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class CreatureListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da criatura',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da criatura',
  })
  referenceImageUrl: string | null;

  @ApiProperty({ description: 'Nome da criatura' })
  name: string;

  @ApiProperty({
    type: () => CreatureCategoryResponseDto,
    description: 'Categoria da criatura',
  })
  category: CreatureCategoryResponseDto;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à criatura',
  })
  tags: TagResponseDto[];

  static fromEntity(creature: Creature): CreatureListItemResponseDto {
    const dto = new CreatureListItemResponseDto();
    dto.id = creature.id;
    dto.referenceImageUrl = creature.referenceImageUrl;
    dto.name = creature.name;
    dto.category = CreatureCategoryResponseDto.fromEntity(creature.category);
    dto.tags = (creature.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
