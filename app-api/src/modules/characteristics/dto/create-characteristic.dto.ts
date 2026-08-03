import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { EntityReferenceInputDto } from '../../entity-links/dto/entity-reference-input.dto';
import { ImprovementFlawItemInputDto } from '../../improvement-flaws/dto/improvement-flaw-item-input.dto';

export class CreateCharacteristicDto {
  @ApiProperty({
    example: 'Força',
    description: 'Nome da característica (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 3,
    description: 'Nível da característica (obrigatório, número inteiro >= 1)',
  })
  @IsInt({ message: 'O nível deve ser um número inteiro.' })
  @Min(1, { message: 'O nível deve ser maior ou igual a 1.' })
  level: number;

  @ApiPropertyOptional({
    example: '<p>Medida do vigor físico do personagem</p>',
    description: 'Descrição da característica (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas à característica (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: () => [EntityReferenceInputDto],
    description:
      'Itens dos quais esta característica é aprimorada. Não pode referenciar a si mesmo, conter duplicatas ou estar simultâneamente em Requisitos.',
    example: [
      {
        entityType: 'talent',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityReferenceInputDto)
  improvedFrom?: EntityReferenceInputDto[];

  @ApiPropertyOptional({
    type: () => [EntityReferenceInputDto],
    description:
      'Itens exigidos como requisito para esta característica. Não pode referenciar a si mesmo, conter duplicatas ou estar simultâneamente em Aprimorado de.',
    example: [
      {
        entityType: 'technique',
        id: '550e8400-e29b-41d4-a716-446655440001',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityReferenceInputDto)
  requirements?: EntityReferenceInputDto[];

  @ApiPropertyOptional({
    type: () => [EntityReferenceInputDto],
    description:
      'Habilidades adicionais associadas a esta característica. Não pode referenciar a si mesmo, conter duplicatas ou estar simultâneamente em Aprimorado de ou em Requisitos.',
    example: [
      {
        entityType: 'technique',
        id: '550e8400-e29b-41d4-a716-446655440002',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityReferenceInputDto)
  additionalAbilities?: EntityReferenceInputDto[];

  @ApiPropertyOptional({
    type: () => [ImprovementFlawItemInputDto],
    description:
      'Melhorias associadas a esta característica. Valor deve ser inteiro >= 1. Tipo e Propriedade devem ser compatíveis (validados via API). Não pode repetir a mesma combinação de Tipo e Propriedade nesta lista nem ter a mesma combinação em Defeitos simultaneamente.',
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
      'Defeitos associados a esta característica. Valor deve ser inteiro >= 1. Tipo e Propriedade devem ser compatíveis (validados via API). Não pode repetir a mesma combinação de Tipo e Propriedade nesta lista nem ter a mesma combinação em Melhorias simultaneamente.',
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
}
