import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

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
    example: '<p>Orelhas pontudas, estatura esguia e traços delicados</p>',
    description:
      'Características físicas da raça (suporta HTML, opcional nesta entidade)',
  })
  @IsOptional()
  @IsString()
  physicalCharacteristics?: string;

  @ApiPropertyOptional({
    example: '<p>Povo antigo, ligado à natureza e à magia</p>',
    description: 'Descrição da raça (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à raça (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
