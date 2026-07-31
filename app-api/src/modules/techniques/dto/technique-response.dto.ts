import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Technique } from '../entities/technique.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EntityReferenceResponseDto } from '../../entity-links/dto/entity-reference-response.dto';

export class TechniqueResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da técnica',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da técnica',
    example: 'Golpe Giratório',
  })
  name: string;

  @ApiProperty({ description: 'Nível da técnica', example: 3 })
  level: number;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da técnica',
    example: 'https://exemplo.com/golpe-giratorio.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da técnica em HTML',
    example: '<p>Um golpe giratório que atinge múltiplos inimigos</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à técnica',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens dos quais esta técnica é aprimorada',
  })
  improvedFrom: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens exigidos como requisito para esta técnica',
  })
  requirements: EntityReferenceResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    technique: Technique,
    improvedFrom: EntityReferenceResponseDto[],
    requirements: EntityReferenceResponseDto[],
  ): TechniqueResponseDto {
    const dto = new TechniqueResponseDto();
    dto.id = technique.id;
    dto.name = technique.name;
    dto.level = technique.level;
    dto.referenceImage = technique.referenceImage;
    dto.description = technique.description;
    dto.tags = (technique.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.improvedFrom = improvedFrom;
    dto.requirements = requirements;
    dto.createdAt = technique.createdAt;
    dto.updatedAt = technique.updatedAt;
    return dto;
  }
}
