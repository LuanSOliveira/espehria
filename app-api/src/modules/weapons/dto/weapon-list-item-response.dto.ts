import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Weapon } from '../entities/weapon.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';
import { SizeGradeResponseDto } from '../../size-grades/dto/size-grade-response.dto';
import { DamageTypeResponseDto } from '../../damage-types/dto/damage-type-response.dto';
import { TraitResponseDto } from '../../traits/dto/trait-response.dto';
import { WeaponHands } from '../enums/weapon-hands.enum';
import { WeaponStyle } from '../enums/weapon-style.enum';
import { WeaponDamageDie } from '../enums/weapon-damage-die.enum';

export class WeaponListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da arma',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da arma',
    example: 'https://exemplo.com/espada-longa.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome da arma',
    example: 'Espada Longa',
  })
  name: string;

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

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à arma',
  })
  tags: TagResponseDto[];

  @ApiPropertyOptional({
    description: 'Apelido da arma',
    example: 'Punhal do Vento',
  })
  nickname: string | null;

  @ApiPropertyOptional({
    description: 'Volume da arma',
    example: 1.5,
  })
  volume: number | null;

  @ApiPropertyOptional({
    type: () => SizeGradeResponseDto,
    description: 'Grau de tamanho da arma',
  })
  sizeGrade: SizeGradeResponseDto | null;

  @ApiPropertyOptional({
    enum: WeaponHands,
    description: 'Quantidade de mãos necessárias para usar a arma: 1 ou 2',
  })
  hands: WeaponHands | null;

  @ApiPropertyOptional({
    enum: WeaponStyle,
    description: 'Estilo da arma: Corpo a Corpo ou A Distância',
  })
  weaponStyle: WeaponStyle | null;

  @ApiProperty({
    type: () => [TraitResponseDto],
    description: 'Traços associados à arma',
  })
  traits: TraitResponseDto[];

  @ApiPropertyOptional({
    description: 'Valor do dano da arma',
    example: 2,
  })
  damageValue: number | null;

  @ApiPropertyOptional({
    enum: WeaponDamageDie,
    description: 'Dado de dano da arma (d2, d4, d6, d8, d10, d12, d20 ou d100)',
  })
  damageDie: WeaponDamageDie | null;

  @ApiPropertyOptional({
    type: () => DamageTypeResponseDto,
    description: 'Tipo de dano da arma',
  })
  damageType: DamageTypeResponseDto | null;

  @ApiProperty({
    description: 'Indica se o dano da arma é mágico',
    example: false,
  })
  magicalDamage: boolean;

  @ApiPropertyOptional({
    description: 'Distância em metros da arma',
    example: 9,
  })
  distanceMeters: number | null;

  @ApiProperty({
    description: 'Indica se a arma usa munição',
    example: false,
  })
  usesAmmunition: boolean;

  @ApiPropertyOptional({
    description: 'Número de ações de recarga da arma',
    example: 1,
  })
  reloadActions: number | null;

  static fromEntity(weapon: Weapon): WeaponListItemResponseDto {
    const dto = new WeaponListItemResponseDto();
    dto.id = weapon.id;
    dto.referenceImage = weapon.referenceImage;
    dto.name = weapon.name;
    dto.price = weapon.price;
    dto.currency = weapon.currency
      ? CurrencyResponseDto.fromEntity(weapon.currency)
      : null;
    dto.tags = (weapon.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.nickname = weapon.nickname;
    dto.volume = weapon.volume;
    dto.sizeGrade = weapon.sizeGrade
      ? SizeGradeResponseDto.fromEntity(weapon.sizeGrade)
      : null;
    dto.hands = weapon.hands;
    dto.weaponStyle = weapon.weaponStyle;
    dto.traits = (weapon.traits ?? []).map((trait) =>
      TraitResponseDto.fromEntity(trait),
    );
    dto.damageValue = weapon.damageValue;
    dto.damageDie = weapon.damageDie;
    dto.damageType = weapon.damageType
      ? DamageTypeResponseDto.fromEntity(weapon.damageType)
      : null;
    dto.magicalDamage = weapon.magicalDamage;
    dto.distanceMeters = weapon.distanceMeters;
    dto.usesAmmunition = weapon.usesAmmunition;
    dto.reloadActions = weapon.reloadActions;
    return dto;
  }
}
