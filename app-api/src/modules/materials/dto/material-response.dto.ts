import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Material } from '../entities/material.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class MaterialResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do material',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do material',
    example: 'Minério de Ferro',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do material',
    example: 'https://exemplo.com/minerio-de-ferro.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do material em HTML',
    example: '<p>Minério bruto extraído das minas do norte</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Preço do material (valor inteiro)',
    example: 10,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço do material',
  })
  currency: CurrencyResponseDto | null;

  @ApiPropertyOptional({
    description: 'Informações privadas do material em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao material, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiPropertyOptional({
    description: 'Volume do material',
    example: 0.2,
  })
  volume: number | null;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(material: Material): MaterialResponseDto {
    const dto = new MaterialResponseDto();
    dto.id = material.id;
    dto.name = material.name;
    dto.referenceImage = material.referenceImage;
    dto.description = material.description;
    dto.price = material.price;
    dto.currency = material.currency
      ? CurrencyResponseDto.fromEntity(material.currency)
      : null;
    dto.privateInformation = material.privateInformation;
    dto.tags = (material.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.volume = material.volume;
    dto.createdAt = material.createdAt;
    dto.updatedAt = material.updatedAt;
    return dto;
  }
}
