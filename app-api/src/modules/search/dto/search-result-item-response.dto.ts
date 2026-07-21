import { ApiProperty } from '@nestjs/swagger';
import { LinkableEntityType } from '../enums/linkable-entity-type.enum';

export class SearchResultItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da entidade',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome da entidade',
  })
  name!: string;

  @ApiProperty({
    enum: LinkableEntityType,
    description: 'Tipo de entidade linkável (usuário ou criatura)',
  })
  entityType!: LinkableEntityType;

  static fromEntity(
    entity: { id: string; name: string },
    entityType: LinkableEntityType,
  ): SearchResultItemResponseDto {
    const dto = new SearchResultItemResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.entityType = entityType;
    return dto;
  }
}
