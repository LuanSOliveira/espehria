import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Armor } from '../entities/armor.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';
import { ArmorCategoryResponseDto } from '../../armor-categories/dto/armor-category-response.dto';
import { TraitResponseDto } from '../../traits/dto/trait-response.dto';

export class ArmorListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da armadura',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da armadura',
    example: 'https://exemplo.com/armadura-de-placas.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome da armadura',
    example: 'Armadura de Placas',
  })
  name: string;

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

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à armadura',
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
    description: 'Traços associados à armadura',
  })
  traits: TraitResponseDto[];

  static fromEntity(armor: Armor): ArmorListItemResponseDto {
    const dto = new ArmorListItemResponseDto();
    dto.id = armor.id;
    dto.referenceImage = armor.referenceImage;
    dto.name = armor.name;
    dto.price = armor.price;
    dto.currency = armor.currency
      ? CurrencyResponseDto.fromEntity(armor.currency)
      : null;
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
    return dto;
  }
}
