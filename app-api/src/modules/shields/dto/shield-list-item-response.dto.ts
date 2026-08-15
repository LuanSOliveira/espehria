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

  @ApiPropertyOptional({
    description: 'Bônus de CA do escudo, mínimo 0',
    example: 2,
  })
  armorClassBonus: number | null;

  @ApiPropertyOptional({
    description: 'Dureza do escudo, mínimo 0',
    example: 5,
  })
  hardness: number | null;

  @ApiPropertyOptional({
    description: 'Pontos de vida do escudo, mínimo 0',
    example: 10,
  })
  hitPoints: number | null;

  @ApiProperty({
    description:
      'Limiar de quebra do escudo (somente leitura, calculado pela API como floor(Pontos de Vida / 2), ou 0 quando Pontos de Vida está vazio/nulo)',
    example: 5,
  })
  breakThreshold: number;

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
    dto.armorClassBonus = shield.armorClassBonus;
    dto.hardness = shield.hardness;
    dto.hitPoints = shield.hitPoints;
    dto.breakThreshold = shield.breakThreshold;
    return dto;
  }
}
