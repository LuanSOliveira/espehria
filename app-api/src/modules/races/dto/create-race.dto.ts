import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ImprovementFlawItemInputDto } from '../../improvement-flaws/dto/improvement-flaw-item-input.dto';
import { ProficiencyItemInputDto } from '../../proficiencies/dto/proficiency-item-input.dto';
import { KnowledgeItemInputDto } from '../../knowledges/dto/knowledge-item-input.dto';

export class CreateRaceDto {
  @ApiProperty({
    example: 'Elfo',
    description: 'Nome da raça (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID da categoria da raça (obrigatório)',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/elfo.jpg',
    description: 'URL de uma imagem de referência da raça',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImageUrl?: string;

  @ApiPropertyOptional({
    example: '<p>Povo antigo, ligado à natureza e à magia</p>',
    description: 'Descrição da raça (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '<p>Anotações internas não destinadas ao público</p>',
    description: 'Informações privadas da raça (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas à raça, na ordem de inserção preservada (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das características associadas à raça (array de UUIDs válidos; ao retornar, incluem id, name, level e tags)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  characteristicIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs dos talentos associados à raça (array de UUIDs válidos; ao retornar, incluem id, name, level e tags)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  talentIds?: string[];

  @ApiPropertyOptional({
    type: () => [ImprovementFlawItemInputDto],
    description:
      'Melhorias associadas a esta raça. Valor deve ser inteiro >= 1. Tipo e Propriedade devem ser compatíveis (validados via API). Não pode repetir a mesma combinação de Tipo e Propriedade nesta lista nem ter a mesma combinação em Defeitos simultaneamente.',
    example: [
      {
        value: 3,
        type: '550e8400-e29b-41d4-a716-446655440003',
        property: '550e8400-e29b-41d4-a716-446655440004',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImprovementFlawItemInputDto)
  improvements?: ImprovementFlawItemInputDto[];

  @ApiPropertyOptional({
    type: () => [ImprovementFlawItemInputDto],
    description:
      'Defeitos associados a esta raça. Valor deve ser inteiro >= 1. Tipo e Propriedade devem ser compatíveis (validados via API). Não pode repetir a mesma combinação de Tipo e Propriedade nesta lista nem ter a mesma combinação em Melhorias simultaneamente.',
    example: [
      {
        value: 2,
        type: '550e8400-e29b-41d4-a716-446655440003',
        property: '550e8400-e29b-41d4-a716-446655440005',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImprovementFlawItemInputDto)
  flaws?: ImprovementFlawItemInputDto[];

  @ApiPropertyOptional({
    type: () => [ProficiencyItemInputDto],
    description:
      'Proficiências associadas a esta raça. Não pode repetir a mesma propriedade nesta lista.',
    example: [
      {
        property: '550e8400-e29b-41d4-a716-446655440006',
        gradation: '550e8400-e29b-41d4-a716-446655440007',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProficiencyItemInputDto)
  proficiencies?: ProficiencyItemInputDto[];

  @ApiPropertyOptional({
    type: () => [KnowledgeItemInputDto],
    description:
      'Saberes associados a esta raça. Não pode repetir o mesmo título (case-insensitive e trim) nesta lista.',
    example: [
      {
        title: 'Astronomia Élfica',
        gradation: '550e8400-e29b-41d4-a716-446655440008',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KnowledgeItemInputDto)
  knowledges?: KnowledgeItemInputDto[];
}
