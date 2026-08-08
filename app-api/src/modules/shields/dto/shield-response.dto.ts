import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Shield } from '../entities/shield.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class ShieldResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do escudo',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do escudo',
    example: 'Escudo de Torre',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do escudo',
    example: 'https://exemplo.com/escudo-de-torre.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do escudo em HTML',
    example: '<p>Um escudo grande capaz de cobrir todo o corpo</p>',
  })
  description: string | null;

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

  @ApiPropertyOptional({
    description: 'Informações privadas do escudo em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao escudo, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(shield: Shield): ShieldResponseDto {
    const dto = new ShieldResponseDto();
    dto.id = shield.id;
    dto.name = shield.name;
    dto.referenceImage = shield.referenceImage;
    dto.description = shield.description;
    dto.price = shield.price;
    dto.currency = shield.currency
      ? CurrencyResponseDto.fromEntity(shield.currency)
      : null;
    dto.privateInformation = shield.privateInformation;
    dto.tags = (shield.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.createdAt = shield.createdAt;
    dto.updatedAt = shield.updatedAt;
    return dto;
  }
}
