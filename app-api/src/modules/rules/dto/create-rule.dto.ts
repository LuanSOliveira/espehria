import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RuleSectionInputDto } from './rule-section-input.dto';

export class CreateRuleDto {
  @ApiProperty({
    example: 'Regras de Combate',
    description: 'Nome da regra (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '<p>Regras que regem os combates entre personagens.</p>',
    description: 'Descrição da regra (suporta HTML)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: () => [RuleSectionInputDto],
    description:
      'Seções da regra, criadas na ordem fornecida (array de seções)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleSectionInputDto)
  sections?: RuleSectionInputDto[];
}
