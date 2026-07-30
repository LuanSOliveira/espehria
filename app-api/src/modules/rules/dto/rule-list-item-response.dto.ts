import { ApiProperty } from '@nestjs/swagger';
import { Rule } from '../entities/rule.entity';

export class RuleListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da regra',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da regra',
    example: 'Regras de Combate',
  })
  name: string;

  static fromEntity(rule: Rule): RuleListItemResponseDto {
    const dto = new RuleListItemResponseDto();
    dto.id = rule.id;
    dto.name = rule.name;
    return dto;
  }
}
