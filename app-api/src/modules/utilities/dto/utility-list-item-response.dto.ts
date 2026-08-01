import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Utility } from '../entities/utility.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class UtilityListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do utilitário',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do utilitário',
    example: 'https://exemplo.com/kit-de-escalada.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do utilitário',
    example: 'Kit de Escalada',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Preço do utilitário (valor inteiro)',
    example: 5,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço do utilitário',
  })
  currency: CurrencyResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao utilitário',
  })
  tags: TagResponseDto[];

  static fromEntity(utility: Utility): UtilityListItemResponseDto {
    const dto = new UtilityListItemResponseDto();
    dto.id = utility.id;
    dto.referenceImage = utility.referenceImage;
    dto.name = utility.name;
    dto.price = utility.price;
    dto.currency = utility.currency
      ? CurrencyResponseDto.fromEntity(utility.currency)
      : null;
    dto.tags = (utility.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
