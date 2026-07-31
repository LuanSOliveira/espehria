import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Technique } from '../entities/technique.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

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

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(technique: Technique): TechniqueResponseDto {
    const dto = new TechniqueResponseDto();
    dto.id = technique.id;
    dto.name = technique.name;
    dto.referenceImage = technique.referenceImage;
    dto.description = technique.description;
    dto.tags = (technique.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = technique.createdAt;
    dto.updatedAt = technique.updatedAt;
    return dto;
  }
}
