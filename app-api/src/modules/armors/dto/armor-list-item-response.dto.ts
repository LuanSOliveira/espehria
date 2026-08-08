import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Armor } from '../entities/armor.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class ArmorListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da armadura',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da armadura',
    example: 'https://exemplo.com/armadura-de-placas.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome da armadura',
    example: 'Armadura de Placas',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Preço da armadura (valor inteiro)',
    example: 10,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço da armadura',
  })
  currency: CurrencyResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à armadura',
  })
  tags: TagResponseDto[];

  static fromEntity(armor: Armor): ArmorListItemResponseDto {
    const dto = new ArmorListItemResponseDto();
    dto.id = armor.id;
    dto.referenceImage = armor.referenceImage;
    dto.name = armor.name;
    dto.price = armor.price;
    dto.currency = armor.currency
      ? CurrencyResponseDto.fromEntity(armor.currency)
      : null;
    dto.tags = (armor.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
