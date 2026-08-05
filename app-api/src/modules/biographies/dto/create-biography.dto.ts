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
import { EntityReferenceInputDto } from '../../entity-links/dto/entity-reference-input.dto';
import { ImprovementFlawItemInputDto } from '../../improvement-flaws/dto/improvement-flaw-item-input.dto';
import { ProficiencyItemInputDto } from '../../proficiencies/dto/proficiency-item-input.dto';

export class CreateBiographyDto {
  @ApiProperty({
    example: 'Biografia do Herói Esquecido',
    description: 'Nome da biografia (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '<p>História de vida do herói esquecido pelo tempo</p>',
    description: 'Descrição da biografia (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/imagens/biografia.png',
    description: 'URL de uma imagem de referência da biografia',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  imageReference?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à biografia, na ordem de inserção preservada (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: () => [EntityReferenceInputDto],
    description:
      'Habilidades adicionais associadas a esta biografia. Não pode referenciar a si mesma nem conter duplicatas.',
    example: [
      {
        entityType: 'training',
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
      'Melhorias associadas a esta biografia. Valor deve ser inteiro >= 1. Tipo e Propriedade devem ser compatíveis (validados via API). Não pode repetir a mesma combinação de Tipo e Propriedade nesta lista.',
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
    type: () => [ProficiencyItemInputDto],
    description:
      'Proficiências associadas a esta biografia. Não pode repetir a mesma propriedade nesta lista.',
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
}
