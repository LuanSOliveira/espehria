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

export class CreateTechniqueDto {
  @ApiProperty({
    example: 'Golpe Giratório',
    description: 'Nome da técnica (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/golpe-giratorio.jpg',
    description: 'URL de uma imagem de referência da técnica',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Um golpe giratório que atinge múltiplos inimigos</p>',
    description: 'Descrição da técnica (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à técnica (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: () => [EntityReferenceInputDto],
    description:
      'Itens dos quais esta técnica é aprimorada. Não pode referenciar a si mesma, conter duplicatas ou estar simultaneamente em Requisitos.',
    example: [
      {
        entityType: 'technique',
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
      'Itens exigidos como requisito para esta técnica. Não pode referenciar a si mesma, conter duplicatas ou estar simultaneamente em Aprimorado de.',
    example: [
      {
        entityType: 'spell',
        id: '550e8400-e29b-41d4-a716-446655440001',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityReferenceInputDto)
  requirements?: EntityReferenceInputDto[];
}
