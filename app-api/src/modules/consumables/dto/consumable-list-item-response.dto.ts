import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Consumable } from '../entities/consumable.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class ConsumableListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do consumível',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do consumível',
    example: 'https://exemplo.com/pocao-de-cura.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do consumível',
    example: 'Poção de Cura',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao consumível',
  })
  tags: TagResponseDto[];

  static fromEntity(consumable: Consumable): ConsumableListItemResponseDto {
    const dto = new ConsumableListItemResponseDto();
    dto.id = consumable.id;
    dto.referenceImage = consumable.referenceImage;
    dto.name = consumable.name;
    dto.tags = (consumable.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
