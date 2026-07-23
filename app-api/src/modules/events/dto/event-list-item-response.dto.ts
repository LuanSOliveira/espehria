import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Event } from '../entities/event.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EraSummaryResponseDto } from '../../eras/dto/era-summary-response.dto';

export class EventListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do evento',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência do evento (pode ser nula se não informada)',
    example: 'https://exemplo.com/grande-batalha.jpg',
  })
  referenceImageUrl: string | null;

  @ApiProperty({
    description: 'Nome do evento',
    example: 'A Grande Batalha',
  })
  name: string;

  @ApiPropertyOptional({
    description:
      'Ano de início do evento (número inteiro, pode ser nulo se não informado)',
    example: 800,
  })
  startYear: number | null;

  @ApiPropertyOptional({
    description:
      'Ano de término do evento (número inteiro, pode ser nulo se não informado)',
    example: 812,
  })
  endYear: number | null;

  @ApiPropertyOptional({
    type: () => EraSummaryResponseDto,
    nullable: true,
    description: 'Era vinculada ao evento (nula quando não vinculado)',
  })
  era: EraSummaryResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao evento (exibidas na listagem)',
  })
  tags: TagResponseDto[];

  static fromEntity(event: Event): EventListItemResponseDto {
    const dto = new EventListItemResponseDto();
    dto.id = event.id;
    dto.referenceImageUrl = event.referenceImageUrl;
    dto.name = event.name;
    dto.startYear = event.startYear;
    dto.endYear = event.endYear;
    dto.era = EraSummaryResponseDto.fromEntity(event.era);
    dto.tags = (event.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
