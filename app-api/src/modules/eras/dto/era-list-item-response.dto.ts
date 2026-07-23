import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Era } from '../entities/era.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class EraListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da era',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência da era (pode ser nula se não informada)',
    example: 'https://exemplo.com/era-antiga.jpg',
  })
  referenceImageUrl: string | null;

  @ApiProperty({
    description: 'Nome da era',
    example: 'Era Antiga',
  })
  name: string;

  @ApiProperty({
    description: 'Posição de ordenação da era',
    example: 1,
  })
  order: number;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à era (exibidas na listagem)',
  })
  tags: TagResponseDto[];

  static fromEntity(era: Era): EraListItemResponseDto {
    const dto = new EraListItemResponseDto();
    dto.id = era.id;
    dto.referenceImageUrl = era.referenceImageUrl;
    dto.name = era.name;
    dto.order = era.order;
    dto.tags = (era.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
