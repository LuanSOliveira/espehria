import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Armor } from '../entities/armor.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';

export class ArmorResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da armadura',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da armadura',
    example: 'Armadura de Placas',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da armadura',
    example: 'https://exemplo.com/armadura-de-placas.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da armadura em HTML',
    example: '<p>Uma armadura pesada feita de placas de aço</p>',
  })
  description: string | null;

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

  @ApiPropertyOptional({
    description: 'Informações privadas da armadura em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à armadura, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(armor: Armor): ArmorResponseDto {
    const dto = new ArmorResponseDto();
    dto.id = armor.id;
    dto.name = armor.name;
    dto.referenceImage = armor.referenceImage;
    dto.description = armor.description;
    dto.price = armor.price;
    dto.currency = armor.currency
      ? CurrencyResponseDto.fromEntity(armor.currency)
      : null;
    dto.privateInformation = armor.privateInformation;
    dto.tags = (armor.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.createdAt = armor.createdAt;
    dto.updatedAt = armor.updatedAt;
    return dto;
  }
}
