import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Family } from '../entities/family.entity';
import { FamilyClassification } from '../enums/family-classification.enum';

export class FamilyShallowResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da família',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da família',
    example: 'Casa Stark',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da família',
    example: 'https://exemplo.com/casa-stark.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    enum: FamilyClassification,
    description: 'Classificação da família',
  })
  classification: FamilyClassification;

  static fromEntity(family: Family): FamilyShallowResponseDto {
    const dto = new FamilyShallowResponseDto();
    dto.id = family.id;
    dto.name = family.name;
    dto.referenceImage = family.referenceImage;
    dto.classification = family.classification;
    return dto;
  }
}
