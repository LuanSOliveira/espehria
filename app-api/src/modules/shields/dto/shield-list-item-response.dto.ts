import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Shield } from '../entities/shield.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class ShieldListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do escudo',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do escudo',
    example: 'https://exemplo.com/escudo-de-torre.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do escudo',
    example: 'Escudo de Torre',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Preço do escudo (valor inteiro)',
    example: 10,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço do escudo',
  })
  currency: CurrencyResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao escudo',
  })
  tags: TagResponseDto[];

  static fromEntity(shield: Shield): ShieldListItemResponseDto {
    const dto = new ShieldListItemResponseDto();
    dto.id = shield.id;
    dto.referenceImage = shield.referenceImage;
    dto.name = shield.name;
    dto.price = shield.price;
    dto.currency = shield.currency
      ? CurrencyResponseDto.fromEntity(shield.currency)
      : null;
    dto.tags = (shield.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
