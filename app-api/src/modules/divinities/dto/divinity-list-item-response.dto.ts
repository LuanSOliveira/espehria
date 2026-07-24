import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Divinity } from '../entities/divinity.entity';
import { DivinityCategoryResponseDto } from './divinity-category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class DivinityListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da divindade',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência da divindade (pode ser nula se não informada; nome de propriedade diverge intencionalmente de "referenceImageUrl", usado em outras entidades do projeto, por especificação literal do requisito)',
    example: 'https://exemplo.com/zeus.jpg',
  })
  referenceImage: string | null;

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

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à divindade (exibidas na listagem)',
  })
  tags: TagResponseDto[];

  static fromEntity(divinity: Divinity): DivinityListItemResponseDto {
    const dto = new DivinityListItemResponseDto();
    dto.id = divinity.id;
    dto.referenceImage = divinity.referenceImage;
    dto.name = divinity.name;
    dto.category = DivinityCategoryResponseDto.fromEntity(divinity.category);
    dto.tags = (divinity.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
