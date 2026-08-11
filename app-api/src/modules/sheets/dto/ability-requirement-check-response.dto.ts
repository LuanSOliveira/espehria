import { ApiProperty } from '@nestjs/swagger';
import { ReferenceableEntityType } from '../../entity-links/enums/referenceable-entity-type.enum';

export class AbilityRequirementCheckResponseDto {
  @ApiProperty({
    enum: ReferenceableEntityType,
    enumName: 'ReferenceableEntityType',
    description: 'Tipo da entidade avaliada (training | talent | characteristic)',
    example: ReferenceableEntityType.TRAINING,
  })
  entityType: ReferenceableEntityType;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da entidade avaliada',
  })
  id: string;

  @ApiProperty({
    description:
      'Indica se este item já está presente na ficha (herdado, em slot ou extra)',
    example: false,
  })
  alreadyPresent: boolean;

  @ApiProperty({
    description: 'Indica se a ficha atende aos requisitos (nível e requirements) deste item',
    example: true,
  })
  requirementsMet: boolean;

  static fromRaw(raw: {
    entityType: ReferenceableEntityType;
    id: string;
    alreadyPresent: boolean;
    requirementsMet: boolean;
  }): AbilityRequirementCheckResponseDto {
    const dto = new AbilityRequirementCheckResponseDto();
    dto.entityType = raw.entityType;
    dto.id = raw.id;
    dto.alreadyPresent = raw.alreadyPresent;
    dto.requirementsMet = raw.requirementsMet;
    return dto;
  }
}
