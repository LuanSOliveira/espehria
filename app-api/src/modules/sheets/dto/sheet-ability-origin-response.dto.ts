import { ApiProperty } from '@nestjs/swagger';
import { ReferenceableEntityType } from '../../entity-links/enums/referenceable-entity-type.enum';

// Origem de um item herdado da ficha: um `ReferenceableEntityType` (Biografia,
// Treinamento, Talento ou Característica já vinculados à ficha) ou 'race' —
// Raça contribui características/talentos diretamente (`race.characteristics`/
// `race.talents`), sem passar por `entity_links`, e por isso não é (nem deve
// se tornar) um valor de `ReferenceableEntityType`.
export type SheetAbilityOriginEntityType = ReferenceableEntityType | 'race';

const SHEET_ABILITY_ORIGIN_ENTITY_TYPES: SheetAbilityOriginEntityType[] = [
  ...Object.values(ReferenceableEntityType),
  'race',
];

export class SheetAbilityOriginResponseDto {
  @ApiProperty({
    enum: SHEET_ABILITY_ORIGIN_ENTITY_TYPES,
    description:
      'Tipo de entidade de origem deste item herdado (inclui "race", que não é um ReferenceableEntityType padrão)',
    example: ReferenceableEntityType.BIOGRAPHY,
  })
  entityType: SheetAbilityOriginEntityType;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da entidade de origem',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da entidade de origem',
    example: 'Elfo',
  })
  name: string;

  static fromRaw(origin: {
    entityType: SheetAbilityOriginEntityType;
    id: string;
    name: string;
  }): SheetAbilityOriginResponseDto {
    const dto = new SheetAbilityOriginResponseDto();
    dto.entityType = origin.entityType;
    dto.id = origin.id;
    dto.name = origin.name;
    return dto;
  }
}
