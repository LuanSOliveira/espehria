import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Divinity } from '../entities/divinity.entity';
import { DivinityCategoryResponseDto } from './divinity-category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class DivinityResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da divindade',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da divindade',
    example: 'Zeus',
  })
  name: string;

  @ApiProperty({
    type: () => DivinityCategoryResponseDto,
    description: 'Categoria da divindade',
  })
  category: DivinityCategoryResponseDto;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência da divindade (pode ser nula se não informada; nome de propriedade diverge intencionalmente de "referenceImageUrl", usado em outras entidades do projeto, por especificação literal do requisito)',
    example: 'https://exemplo.com/zeus.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description:
      'Descrição da divindade em HTML (pode ser nula se não informada)',
    example: '<p>Deus do trovão e governante do Olimpo</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à divindade',
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

  static fromEntity(divinity: Divinity): DivinityResponseDto {
    const dto = new DivinityResponseDto();
    dto.id = divinity.id;
    dto.name = divinity.name;
    dto.category = DivinityCategoryResponseDto.fromEntity(divinity.category);
    dto.referenceImage = divinity.referenceImage;
    dto.description = divinity.description;
    dto.tags = (divinity.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = divinity.createdAt;
    dto.updatedAt = divinity.updatedAt;
    return dto;
  }
}
