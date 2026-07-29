import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../entities/location.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { LocationShallowResponseDto } from './location-shallow-response.dto';
import { LocationSectionResponseDto } from './location-section-response.dto';

export class LocationResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do local',
  })
  id: string;

  @ApiProperty({ description: 'Nome do local', example: 'Floresta Sombria' })
  name: string;

  @ApiPropertyOptional({ description: 'Tipo do local', example: 'Floresta' })
  type: string | null;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do local',
    example: 'https://exemplo.com/floresta.jpg',
  })
  referenceImageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do local (HTML)',
    example: '<p>Uma floresta densa e sombria, raramente visitada.</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas do local (HTML)',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao local',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [LocationShallowResponseDto],
    description: 'Outros locais associados como pontos de interesse',
  })
  pointsOfInterest: LocationShallowResponseDto[];

  @ApiProperty({
    type: () => [LocationShallowResponseDto],
    description:
      'Locais que apontam para este como ponto de interesse. Campo somente leitura — não aceito em requisições de criação/atualização',
  })
  pointsOfInterestOf: LocationShallowResponseDto[];

  @ApiProperty({
    type: () => [LocationSectionResponseDto],
    description: 'Seções do local',
  })
  sections: LocationSectionResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(location: Location): LocationResponseDto {
    const dto = new LocationResponseDto();
    dto.id = location.id;
    dto.name = location.name;
    dto.type = location.type;
    dto.referenceImageUrl = location.referenceImageUrl;
    dto.description = location.description;
    dto.privateInformation = location.privateInformation;
    dto.tags = (location.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.pointsOfInterest = (location.pointsOfInterest ?? []).map((poi) =>
      LocationShallowResponseDto.fromEntity(poi),
    );
    dto.pointsOfInterestOf = (location.pointsOfInterestOf ?? []).map((poi) =>
      LocationShallowResponseDto.fromEntity(poi),
    );
    dto.sections = (location.sections ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => LocationSectionResponseDto.fromEntity(section));
    dto.createdAt = location.createdAt;
    dto.updatedAt = location.updatedAt;
    return dto;
  }
}
