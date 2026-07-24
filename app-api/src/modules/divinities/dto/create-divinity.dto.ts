import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateDivinityDto {
  @ApiProperty({
    example: 'Zeus',
    description: 'Nome da divindade (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID da categoria da divindade (obrigatório)',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/zeus.jpg',
    description:
      'URL de uma imagem de referência da divindade (nome de propriedade diverge intencionalmente de "referenceImageUrl", usado em outras entidades do projeto, por especificação literal do requisito)',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Deus do trovão e governante do Olimpo</p>',
    description: 'Descrição da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à divindade (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
