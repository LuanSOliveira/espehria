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
import { WeaponDamageResponseDto } from './weapon-damage-response.dto';

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
    description: 'Traços associados à arma, na ordem de inserção',
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

  @ApiProperty({
    type: () => [WeaponDamageResponseDto],
    description:
      'Danos alternativos da arma (lista independente com os mesmos 7 campos do dano principal: valor, dado, tipo de dano, dano mágico, distância, munição, ações de recarga). A ordem de resposta reflete a ordem de inserção',
  })
  alternativeDamages: WeaponDamageResponseDto[];

  @ApiProperty({
    type: () => [WeaponDamageResponseDto],
    description: 'Danos extras da arma (lista independente com os mesmos 7 campos do dano principal: valor, dado, tipo de dano, dano mágico, distância, munição, ações de recarga). A ordem de resposta reflete a ordem de inserção',
  })
  extraDamages: WeaponDamageResponseDto[];

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
    dto.alternativeDamages = (weapon.alternativeDamages ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((damage) => WeaponDamageResponseDto.fromEntity(damage));
    dto.extraDamages = (weapon.extraDamages ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((damage) => WeaponDamageResponseDto.fromEntity(damage));
    dto.createdAt = weapon.createdAt;
    dto.updatedAt = weapon.updatedAt;
    return dto;
  }
}
