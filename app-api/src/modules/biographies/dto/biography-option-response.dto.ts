import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Biography } from '../entities/biography.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class BiographyOptionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da biografia',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da biografia',
    example: 'Biografia do Herói Esquecido',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da biografia em HTML',
    example: '<p>História de vida do herói esquecido pelo tempo</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da biografia',
    example: 'https://example.com/imagens/biografia.png',
  })
  imageReference: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à biografia',
  })
  tags: TagResponseDto[];

  static fromEntity(biography: Biography): BiographyOptionResponseDto {
    const dto = new BiographyOptionResponseDto();
    dto.id = biography.id;
    dto.name = biography.name;
    dto.description = biography.description;
    dto.imageReference = biography.imageReference;
    dto.tags = (biography.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
