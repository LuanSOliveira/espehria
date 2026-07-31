import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Technique } from '../entities/technique.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class TechniqueListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da técnica',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da técnica',
    example: 'https://exemplo.com/golpe-giratorio.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome da técnica',
    example: 'Golpe Giratório',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à técnica',
  })
  tags: TagResponseDto[];

  static fromEntity(technique: Technique): TechniqueListItemResponseDto {
    const dto = new TechniqueListItemResponseDto();
    dto.id = technique.id;
    dto.referenceImage = technique.referenceImage;
    dto.name = technique.name;
    dto.tags = (technique.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
