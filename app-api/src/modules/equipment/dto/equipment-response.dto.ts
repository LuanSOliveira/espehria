import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equipment } from '../entities/equipment.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class EquipmentResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do equipamento',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do equipamento',
    example: 'Espada Longa',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do equipamento',
    example: 'https://exemplo.com/espada-longa.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do equipamento em HTML',
    example: '<p>Espada forjada em aço élfico</p>',
  })
  description: string | null;

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

  @ApiPropertyOptional({
    description: 'Informações privadas do equipamento em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao equipamento, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(equipment: Equipment): EquipmentResponseDto {
    const dto = new EquipmentResponseDto();
    dto.id = equipment.id;
    dto.name = equipment.name;
    dto.referenceImage = equipment.referenceImage;
    dto.description = equipment.description;
    dto.price = equipment.price;
    dto.currency = equipment.currency
      ? CurrencyResponseDto.fromEntity(equipment.currency)
      : null;
    dto.privateInformation = equipment.privateInformation;
    dto.tags = (equipment.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = equipment.createdAt;
    dto.updatedAt = equipment.updatedAt;
    return dto;
  }
}
