import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Shield } from '../entities/shield.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto';
import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto';

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

  @ApiPropertyOptional({
    description: 'Apelido do escudo',
    example: 'Escudo da Guarda',
  })
  nickname: string | null;

  @ApiPropertyOptional({
    description: 'Volume do escudo',
    example: 15.5,
  })
  volume: number | null;

  @ApiPropertyOptional({
    description: 'Bônus de CA do escudo, mínimo 0',
    example: 2,
  })
  armorClassBonus: number | null;

  @ApiPropertyOptional({
    description: 'Penalidade de velocidade em metros do escudo',
    example: 3,
  })
  speedPenaltyMeters: number | null;

  @ApiPropertyOptional({
    description: 'Dureza do escudo, mínimo 0',
    example: 5,
  })
  hardness: number | null;

  @ApiPropertyOptional({
    description: 'Pontos de vida do escudo, mínimo 0',
    example: 10,
  })
  hitPoints: number | null;

  @ApiProperty({
    description:
      'Limiar de quebra do escudo (somente leitura, calculado pela API como floor(Pontos de Vida / 2), ou 0 quando Pontos de Vida está vazio/nulo)',
    example: 5,
  })
  breakThreshold: number;

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Encantamentos do escudo: cópia independente de nome/efeito escolhidos do catálogo de Encantamentos, sem vínculo/FK com a entidade Enchantment. Ordem de inserção preservada',
  })
  enchantments: EmbeddedEffectResponseDto[];

  @ApiProperty({
    type: () => [EmbeddedEffectResponseDto],
    description:
      'Aprimoramentos do escudo: cópia independente de nome/efeito escolhidos do catálogo de Aprimoramentos, sem vínculo/FK com a entidade Enhancement. Ordem de inserção preservada',
  })
  enhancements: EmbeddedEffectResponseDto[];

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
    dto.nickname = shield.nickname;
    dto.volume = shield.volume;
    dto.armorClassBonus = shield.armorClassBonus;
    dto.speedPenaltyMeters = shield.speedPenaltyMeters;
    dto.hardness = shield.hardness;
    dto.hitPoints = shield.hitPoints;
    dto.breakThreshold = shield.breakThreshold;
    dto.enchantments = (shield.enchantments ?? []).map((item) =>
      EmbeddedEffectResponseDto.fromEntity(item),
    );
    dto.enhancements = (shield.enhancements ?? []).map((item) =>
      EmbeddedEffectResponseDto.fromEntity(item),
    );
    dto.createdAt = shield.createdAt;
    dto.updatedAt = shield.updatedAt;
    return dto;
  }
}
