import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Accessory } from '../entities/accessory.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';
import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto';

export class AccessoryResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do acessório',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do acessório',
    example: 'Anel de Proteção',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do acessório',
    example: 'https://exemplo.com/anel-de-protecao.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do acessório em HTML',
    example: '<p>Um anel encantado que protege seu portador</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Preço do acessório (valor inteiro)',
    example: 10,
  })
  price: number | null;

  @ApiPropertyOptional({
    type: () => CurrencyResponseDto,
    description: 'Moeda associada ao preço do acessório',
  })
  currency: CurrencyResponseDto | null;

  @ApiPropertyOptional({
    description: 'Informações privadas do acessório em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao acessório, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Encantamentos do acessório: cópia independente de nome/efeito escolhidos do catálogo de Encantamentos, sem vínculo/FK com a entidade Enchantment. Ordem de inserção preservada',
  })
  enchantments: EmbeddedEffectResponseDto[];

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Aprimoramentos do acessório: cópia independente de nome/efeito escolhidos do catálogo de Aprimoramentos, sem vínculo/FK com a entidade Enhancement. Ordem de inserção preservada',
  })
  enhancements: EmbeddedEffectResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(accessory: Accessory): AccessoryResponseDto {
    const dto = new AccessoryResponseDto();
    dto.id = accessory.id;
    dto.name = accessory.name;
    dto.referenceImage = accessory.referenceImage;
    dto.description = accessory.description;
    dto.price = accessory.price;
    dto.currency = accessory.currency
      ? CurrencyResponseDto.fromEntity(accessory.currency)
      : null;
    dto.privateInformation = accessory.privateInformation;
    dto.tags = (accessory.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.enchantments = (accessory.enchantments ?? []).map((item) =>
      EmbeddedEffectResponseDto.fromEntity(item),
    );
    dto.enhancements = (accessory.enhancements ?? []).map((item) =>
      EmbeddedEffectResponseDto.fromEntity(item),
    );
    dto.createdAt = accessory.createdAt;
    dto.updatedAt = accessory.updatedAt;
    return dto;
  }
}
