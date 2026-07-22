import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../entities/location.entity';

export class LocationShallowResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do local',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do local',
    example: 'Floresta Sombria',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do local',
    example: 'https://exemplo.com/floresta.jpg',
  })
  referenceImageUrl: string | null;

  static fromEntity(location: Location): LocationShallowResponseDto {
    const dto = new LocationShallowResponseDto();
    dto.id = location.id;
    dto.name = location.name;
    dto.referenceImageUrl = location.referenceImageUrl;
    return dto;
  }
}
