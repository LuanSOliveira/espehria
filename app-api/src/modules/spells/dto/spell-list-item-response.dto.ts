import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Spell } from '../entities/spell.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class SpellListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da magia',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da magia',
    example: 'https://exemplo.com/bola-de-fogo.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome da magia',
    example: 'Bola de Fogo',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à magia',
  })
  tags: TagResponseDto[];

  static fromEntity(spell: Spell): SpellListItemResponseDto {
    const dto = new SpellListItemResponseDto();
    dto.id = spell.id;
    dto.referenceImage = spell.referenceImage;
    dto.name = spell.name;
    dto.tags = (spell.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
