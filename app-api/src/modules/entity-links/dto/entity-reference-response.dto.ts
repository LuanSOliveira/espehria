import { ApiProperty } from '@nestjs/swagger';
import { ReferenceableEntityType } from '../enums/referenceable-entity-type.enum';

export class EntityReferenceResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único (UUID) da entidade referenciada',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome da entidade referenciada',
    example: 'Treinamento de Combate',
  })
  name!: string;

  @ApiProperty({
    enum: ReferenceableEntityType,
    enumName: 'ReferenceableEntityType',
    description: 'Tipo de entidade referenciada',
    example: ReferenceableEntityType.TRAINING,
  })
  entityType!: ReferenceableEntityType;

  static fromResolved(
    entity: { id: string; name: string },
    entityType: ReferenceableEntityType,
  ): EntityReferenceResponseDto {
    const dto = new EntityReferenceResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.entityType = entityType;
    return dto;
  }
}
