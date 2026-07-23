import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Race } from '../entities/race.entity';
import { RaceCategoryResponseDto } from './race-category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class RaceListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da raça',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência da raça (pode ser nula se não informada)',
    example: 'https://exemplo.com/elfo.jpg',
  })
  referenceImageUrl: string | null;

  @ApiProperty({
    description: 'Nome da raça',
    example: 'Elfo',
  })
  name: string;

  @ApiProperty({
    type: () => RaceCategoryResponseDto,
    description: 'Categoria da raça',
  })
  category: RaceCategoryResponseDto;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à raça (exibidas na listagem)',
  })
  tags: TagResponseDto[];

  static fromEntity(race: Race): RaceListItemResponseDto {
    const dto = new RaceListItemResponseDto();
    dto.id = race.id;
    dto.referenceImageUrl = race.referenceImageUrl;
    dto.name = race.name;
    dto.category = RaceCategoryResponseDto.fromEntity(race.category);
    dto.tags = (race.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
