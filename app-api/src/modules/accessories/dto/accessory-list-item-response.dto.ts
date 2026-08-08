import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Accessory } from '../entities/accessory.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class AccessoryListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do acessório',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do acessório',
    example: 'https://exemplo.com/anel-de-protecao.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do acessório',
    example: 'Anel de Proteção',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Preço do acessório (valor inteiro)',
    example: 10,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço do acessório',
  })
  currency: CurrencyResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao acessório',
  })
  tags: TagResponseDto[];

  static fromEntity(accessory: Accessory): AccessoryListItemResponseDto {
    const dto = new AccessoryListItemResponseDto();
    dto.id = accessory.id;
    dto.referenceImage = accessory.referenceImage;
    dto.name = accessory.name;
    dto.price = accessory.price;
    dto.currency = accessory.currency
      ? CurrencyResponseDto.fromEntity(accessory.currency)
      : null;
    dto.tags = (accessory.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
