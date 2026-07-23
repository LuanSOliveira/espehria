import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Event } from '../entities/event.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EraSummaryResponseDto } from '../../eras/dto/era-summary-response.dto';

export class EventResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do evento',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do evento',
    example: 'A Grande Batalha',
  })
  name: string;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência do evento (pode ser nula se não informada)',
    example: 'https://exemplo.com/grande-batalha.jpg',
  })
  referenceImageUrl: string | null;

  @ApiPropertyOptional({
    description:
      'Ano de início do evento (texto livre, pode ser nulo se não informado)',
    example: 'Ano 800 da Era Antiga',
  })
  startYear: string | null;

  @ApiPropertyOptional({
    description:
      'Ano de término do evento (texto livre, pode ser nulo se não informado)',
    example: 'Ano 812 da Era Antiga',
  })
  endYear: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do evento em HTML (pode ser nula se não informada)',
    example: '<p>Confronto decisivo entre os reinos do norte e do sul</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    type: () => EraSummaryResponseDto,
    nullable: true,
    description: 'Era vinculada ao evento (nula quando não vinculado)',
  })
  era: EraSummaryResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao evento',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-01-15T10:30:00Z',
  })
  updatedAt: Date;

  static fromEntity(event: Event): EventResponseDto {
    const dto = new EventResponseDto();
    dto.id = event.id;
    dto.name = event.name;
    dto.referenceImageUrl = event.referenceImageUrl;
    dto.startYear = event.startYear;
    dto.endYear = event.endYear;
    dto.description = event.description;
    dto.era = EraSummaryResponseDto.fromEntity(event.era);
    dto.tags = (event.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.createdAt = event.createdAt;
    dto.updatedAt = event.updatedAt;
    return dto;
  }
}
