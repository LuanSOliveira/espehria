import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Condition } from '../entities/condition.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { ConditionSectionResponseDto } from './condition-section-response.dto';

export class ConditionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da condição',
  })
  id: string;

  @ApiProperty({ description: 'Nome da condição', example: 'Envenenado' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da condição (HTML)',
    example: '<p>Sofre efeitos contínuos de veneno.</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à condição, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [ConditionSectionResponseDto],
    description: 'Seções da condição',
  })
  sections: ConditionSectionResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(condition: Condition): ConditionResponseDto {
    const dto = new ConditionResponseDto();
    dto.id = condition.id;
    dto.name = condition.name;
    dto.description = condition.description;
    dto.tags = (condition.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.sections = (condition.sections ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => ConditionSectionResponseDto.fromEntity(section));
    dto.createdAt = condition.createdAt;
    dto.updatedAt = condition.updatedAt;
    return dto;
  }
}
