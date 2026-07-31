import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { EntityReferenceInputDto } from '../../entity-links/dto/entity-reference-input.dto';

export class CreateTalentDto {
  @ApiProperty({
    example: 'Talento para Persuasão',
    description: 'Nome do talento (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '<p>Facilidade natural em convencer outras pessoas</p>',
    description: 'Descrição do talento (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas ao talento (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: () => [EntityReferenceInputDto],
    description:
      'Itens dos quais este talento é aprimorado. Não pode referenciar a si mesmo, conter duplicatas ou estar simultâneamente em Requisitos.',
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
      'Itens exigidos como requisito para este talento. Não pode referenciar a si mesmo, conter duplicatas ou estar simultâneamente em Aprimorado de.',
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
}
