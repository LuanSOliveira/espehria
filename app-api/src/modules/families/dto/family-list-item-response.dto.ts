import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Family } from '../entities/family.entity';
import { FamilyClassification } from '../enums/family-classification.enum';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class FamilyListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da família',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da família',
    example: 'https://exemplo.com/casa-stark.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome da família',
    example: 'Casa Stark',
  })
  name: string;

  @ApiProperty({
    enum: FamilyClassification,
    description: 'Classificação da família',
  })
  classification: FamilyClassification;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à família',
  })
  tags: TagResponseDto[];

  static fromEntity(family: Family): FamilyListItemResponseDto {
    const dto = new FamilyListItemResponseDto();
    dto.id = family.id;
    dto.referenceImage = family.referenceImage;
    dto.name = family.name;
    dto.classification = family.classification;
    dto.tags = (family.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
