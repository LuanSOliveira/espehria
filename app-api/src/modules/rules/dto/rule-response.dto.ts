import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Rule } from '../entities/rule.entity';
import { RuleSectionResponseDto } from './rule-section-response.dto';

export class RuleResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da regra',
  })
  id: string;

  @ApiProperty({ description: 'Nome da regra', example: 'Regras de Combate' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da regra (HTML)',
    example: '<p>Regras que regem os combates entre personagens.</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [RuleSectionResponseDto],
    description: 'Seções da regra',
  })
  sections: RuleSectionResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(rule: Rule): RuleResponseDto {
    const dto = new RuleResponseDto();
    dto.id = rule.id;
    dto.name = rule.name;
    dto.description = rule.description;
    dto.sections = (rule.sections ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => RuleSectionResponseDto.fromEntity(section));
    dto.createdAt = rule.createdAt;
    dto.updatedAt = rule.updatedAt;
    return dto;
  }
}
