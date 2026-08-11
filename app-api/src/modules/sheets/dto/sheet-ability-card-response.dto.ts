import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { SheetAbilityOriginResponseDto } from './sheet-ability-origin-response.dto';

export class SheetAbilityCardResponseDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Identificador único da Característica/Treinamento/Talento representado por este card',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da entidade representada por este card',
    example: 'Força Sobre-humana',
  })
  name: string;

  @ApiProperty({
    description: 'Nível da entidade representada por este card',
    example: 3,
  })
  level: number;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à entidade representada por este card',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    description:
      'Indica se a ficha atende aos requisitos (nível e requirements) deste item',
    example: true,
  })
  requirementsMet: boolean;

  @ApiPropertyOptional({
    type: () => SheetAbilityOriginResponseDto,
    nullable: true,
    description:
      'Entidade de origem deste item (preenchido apenas para itens herdados; nulo para itens de slot ou extra)',
  })
  origin: SheetAbilityOriginResponseDto | null;

  static fromRaw(card: {
    id: string;
    name: string;
    level: number;
    tags: TagResponseDto[];
    requirementsMet: boolean;
    origin: SheetAbilityOriginResponseDto | null;
  }): SheetAbilityCardResponseDto {
    const dto = new SheetAbilityCardResponseDto();
    dto.id = card.id;
    dto.name = card.name;
    dto.level = card.level;
    dto.tags = card.tags;
    dto.requirementsMet = card.requirementsMet;
    dto.origin = card.origin;
    return dto;
  }
}
