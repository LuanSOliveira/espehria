import { ApiProperty } from '@nestjs/swagger';
import { ReferenceableEntityType } from '../enums/referenceable-entity-type.enum';
import { Tag } from '../../tags/entities/tag.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

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

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à entidade referenciada',
  })
  tags!: TagResponseDto[];

  static fromResolved(
    entity: { id: string; name: string; tags?: Tag[] },
    entityType: ReferenceableEntityType,
  ): EntityReferenceResponseDto {
    const dto = new EntityReferenceResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.entityType = entityType;
    dto.tags = (entity.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
