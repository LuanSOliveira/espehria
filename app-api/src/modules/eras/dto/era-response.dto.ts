import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Era } from '../entities/era.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class EraResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da era',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da era',
    example: 'Era Antiga',
  })
  name: string;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência da era (pode ser nula se não informada)',
    example: 'https://exemplo.com/era-antiga.jpg',
  })
  referenceImageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da era em HTML (pode ser nula se não informada)',
    example:
      '<p>Período marcado pelo surgimento das primeiras civilizações</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas da era em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    description: 'Posição de ordenação da era',
    example: 1,
  })
  order: number;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à era',
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

  static fromEntity(era: Era): EraResponseDto {
    const dto = new EraResponseDto();
    dto.id = era.id;
    dto.name = era.name;
    dto.referenceImageUrl = era.referenceImageUrl;
    dto.description = era.description;
    dto.privateInformation = era.privateInformation;
    dto.order = era.order;
    dto.tags = (era.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.createdAt = era.createdAt;
    dto.updatedAt = era.updatedAt;
    return dto;
  }
}
