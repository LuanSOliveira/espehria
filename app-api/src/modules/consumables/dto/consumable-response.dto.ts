import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Consumable } from '../entities/consumable.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class ConsumableResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do consumível',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do consumível',
    example: 'Poção de Cura',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do consumível',
    example: 'https://exemplo.com/pocao-de-cura.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do consumível em HTML',
    example: '<p>Poção que restaura vitalidade ao ser ingerida</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Preço do consumível (valor inteiro)',
    example: 15,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço do consumível',
  })
  currency: CurrencyResponseDto | null;

  @ApiPropertyOptional({
    description: 'Informações privadas do consumível em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao consumível',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(consumable: Consumable): ConsumableResponseDto {
    const dto = new ConsumableResponseDto();
    dto.id = consumable.id;
    dto.name = consumable.name;
    dto.referenceImage = consumable.referenceImage;
    dto.description = consumable.description;
    dto.price = consumable.price;
    dto.currency = consumable.currency
      ? CurrencyResponseDto.fromEntity(consumable.currency)
      : null;
    dto.privateInformation = consumable.privateInformation;
    dto.tags = (consumable.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = consumable.createdAt;
    dto.updatedAt = consumable.updatedAt;
    return dto;
  }
}
