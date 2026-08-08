import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Weapon } from '../entities/weapon.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class WeaponListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da arma',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da arma',
    example: 'https://exemplo.com/espada-longa.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome da arma',
    example: 'Espada Longa',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Preço da arma (valor inteiro)',
    example: 10,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço da arma',
  })
  currency: CurrencyResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à arma',
  })
  tags: TagResponseDto[];

  static fromEntity(weapon: Weapon): WeaponListItemResponseDto {
    const dto = new WeaponListItemResponseDto();
    dto.id = weapon.id;
    dto.referenceImage = weapon.referenceImage;
    dto.name = weapon.name;
    dto.price = weapon.price;
    dto.currency = weapon.currency
      ? CurrencyResponseDto.fromEntity(weapon.currency)
      : null;
    dto.tags = (weapon.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
