import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Material } from '../entities/material.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class MaterialListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do material',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do material',
    example: 'https://exemplo.com/minerio-de-ferro.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do material',
    example: 'Minério de Ferro',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao material',
  })
  tags: TagResponseDto[];

  static fromEntity(material: Material): MaterialListItemResponseDto {
    const dto = new MaterialListItemResponseDto();
    dto.id = material.id;
    dto.referenceImage = material.referenceImage;
    dto.name = material.name;
    dto.tags = (material.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
