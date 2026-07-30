import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ammunition } from '../entities/ammunition.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class AmmunitionListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do item de munição',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do item de munição',
    example: 'https://exemplo.com/flecha-de-aco.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do item de munição',
    example: 'Flecha de Aço',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao item de munição',
  })
  tags: TagResponseDto[];

  static fromEntity(ammunition: Ammunition): AmmunitionListItemResponseDto {
    const dto = new AmmunitionListItemResponseDto();
    dto.id = ammunition.id;
    dto.referenceImage = ammunition.referenceImage;
    dto.name = ammunition.name;
    dto.tags = (ammunition.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
