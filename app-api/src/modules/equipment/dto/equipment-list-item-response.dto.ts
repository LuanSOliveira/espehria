import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equipment } from '../entities/equipment.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class EquipmentListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do equipamento',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do equipamento',
    example: 'https://exemplo.com/espada-longa.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do equipamento',
    example: 'Espada Longa',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Preço do equipamento (valor inteiro)',
    example: 50,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço do equipamento',
  })
  currency: CurrencyResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao equipamento',
  })
  tags: TagResponseDto[];

  static fromEntity(equipment: Equipment): EquipmentListItemResponseDto {
    const dto = new EquipmentListItemResponseDto();
    dto.id = equipment.id;
    dto.referenceImage = equipment.referenceImage;
    dto.name = equipment.name;
    dto.price = equipment.price;
    dto.currency = equipment.currency
      ? CurrencyResponseDto.fromEntity(equipment.currency)
      : null;
    dto.tags = (equipment.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
