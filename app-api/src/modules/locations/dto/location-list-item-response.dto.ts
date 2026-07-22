import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../entities/location.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class LocationListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do local',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do local',
    example: 'https://exemplo.com/floresta.jpg',
  })
  referenceImageUrl: string | null;

  @ApiProperty({
    description: 'Nome do local',
    example: 'Floresta Sombria',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Tipo do local',
    example: 'Floresta',
  })
  type: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao local',
  })
  tags: TagResponseDto[];

  static fromEntity(location: Location): LocationListItemResponseDto {
    const dto = new LocationListItemResponseDto();
    dto.id = location.id;
    dto.referenceImageUrl = location.referenceImageUrl;
    dto.name = location.name;
    dto.type = location.type;
    dto.tags = (location.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
