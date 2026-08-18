import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Armor } from '../entities/armor.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';
import { ArmorCategoryResponseDto } from '../../armor-categories/dto/armor-category-response.dto';
import { TraitResponseDto } from '../../traits/dto/trait-response.dto';
import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto';

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

  @ApiPropertyOptional({
    description: 'Apelido da armadura',
    example: 'Couraça da Guarda',
  })
  nickname: string | null;

  @ApiPropertyOptional({
    description: 'Volume da armadura',
    example: 15.5,
  })
  volume: number | null;

  @ApiPropertyOptional({
    type: () => ArmorCategoryResponseDto,
    description: 'Categoria da armadura',
  })
  armorCategory: ArmorCategoryResponseDto | null;

  @ApiPropertyOptional({
    description: 'Bônus de CA da armadura, mínimo 0',
    example: 2,
  })
  armorClassBonus: number | null;

  @ApiPropertyOptional({
    description: 'Limite de modificador de Destreza da armadura, mínimo 1',
    example: 2,
  })
  dexterityModifierLimit: number | null;

  @ApiPropertyOptional({
    description: 'Força mínima exigida pela armadura, mínimo 0',
    example: 13,
  })
  strength: number | null;

  @ApiPropertyOptional({
    description: 'Penalidade em teste da armadura, mínimo 1',
    example: 1,
  })
  checkPenalty: number | null;

  @ApiPropertyOptional({
    description: 'Penalidade de velocidade em metros da armadura',
    example: 3,
  })
  speedPenaltyMeters: number | null;

  @ApiProperty({
    type: () => [TraitResponseDto],
    description: 'Traços associados à armadura, na ordem de inserção',
  })
  traits: TraitResponseDto[];

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Encantamentos da armadura: cópia independente de nome/efeito escolhidos do catálogo de Encantamentos, sem vínculo/FK com a entidade Enchantment. Ordem de inserção preservada',
  })
  enchantments: EmbeddedEffectResponseDto[];

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Aprimoramentos da armadura: cópia independente de nome/efeito escolhidos do catálogo de Aprimoramentos, sem vínculo/FK com a entidade Enhancement. Ordem de inserção preservada',
  })
  enhancements: EmbeddedEffectResponseDto[];

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
    dto.nickname = armor.nickname;
    dto.volume = armor.volume;
    dto.armorCategory = armor.armorCategory
      ? ArmorCategoryResponseDto.fromEntity(armor.armorCategory)
      : null;
    dto.armorClassBonus = armor.armorClassBonus;
    dto.dexterityModifierLimit = armor.dexterityModifierLimit;
    dto.strength = armor.strength;
    dto.checkPenalty = armor.checkPenalty;
    dto.speedPenaltyMeters = armor.speedPenaltyMeters;
    dto.traits = (armor.traits ?? []).map((trait) =>
      TraitResponseDto.fromEntity(trait),
    );
    dto.enchantments = (armor.enchantments ?? []).map((item) =>
      EmbeddedEffectResponseDto.fromEntity(item),
    );
    dto.enhancements = (armor.enhancements ?? []).map((item) =>
      EmbeddedEffectResponseDto.fromEntity(item),
    );
    dto.createdAt = armor.createdAt;
    dto.updatedAt = armor.updatedAt;
    return dto;
  }
}
