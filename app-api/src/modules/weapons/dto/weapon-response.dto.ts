import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Weapon } from '../entities/weapon.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class WeaponResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da arma',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da arma',
    example: 'Espada Longa',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da arma',
    example: 'https://exemplo.com/espada-longa.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da arma em HTML',
    example: '<p>Uma espada longa forjada em aço</p>',
  })
  description: string | null;

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

  @ApiPropertyOptional({
    description: 'Informações privadas da arma em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à arma, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(weapon: Weapon): WeaponResponseDto {
    const dto = new WeaponResponseDto();
    dto.id = weapon.id;
    dto.name = weapon.name;
    dto.referenceImage = weapon.referenceImage;
    dto.description = weapon.description;
    dto.price = weapon.price;
    dto.currency = weapon.currency
      ? CurrencyResponseDto.fromEntity(weapon.currency)
      : null;
    dto.privateInformation = weapon.privateInformation;
    dto.tags = (weapon.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.createdAt = weapon.createdAt;
    dto.updatedAt = weapon.updatedAt;
    return dto;
  }
}
