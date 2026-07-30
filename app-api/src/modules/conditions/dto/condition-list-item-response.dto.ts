import { ApiProperty } from '@nestjs/swagger';
import { Condition } from '../entities/condition.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class ConditionListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da condição',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da condição',
    example: 'Envenenado',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à condição',
  })
  tags: TagResponseDto[];

  static fromEntity(condition: Condition): ConditionListItemResponseDto {
    const dto = new ConditionListItemResponseDto();
    dto.id = condition.id;
    dto.name = condition.name;
    dto.tags = (condition.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
