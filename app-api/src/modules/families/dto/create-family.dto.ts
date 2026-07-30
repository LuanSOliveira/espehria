import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { FamilyClassification } from '../enums/family-classification.enum';
import { FamilyMemberInputDto } from './family-member-input.dto';
import { FamilyRelationshipInputDto } from './family-relationship-input.dto';

export class CreateFamilyDto {
  @ApiProperty({
    example: 'Casa Stark',
    description: 'Nome da família (obrigatório, não único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/casa-stark.jpg',
    description: 'URL de uma imagem de referência da família',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Antiga casa nobre que governa o norte</p>',
    description: 'Descrição da família (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '<p>Anotações internas não destinadas ao público</p>',
    description: 'Informações privadas da família (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiProperty({
    enum: FamilyClassification,
    description: 'Classificação da família',
    example: FamilyClassification.NOBILITY,
  })
  @IsEnum(FamilyClassification)
  classification: FamilyClassification;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à família (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: () => [FamilyMemberInputDto],
    description:
      'Membros posicionados na árvore genealógica (cards de personagens)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberInputDto)
  members?: FamilyMemberInputDto[];

  @ApiPropertyOptional({
    type: () => [FamilyRelationshipInputDto],
    description:
      'Vínculos de parentesco entre os membros da árvore genealógica',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyRelationshipInputDto)
  relationships?: FamilyRelationshipInputDto[];
}
