import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateCharacterDto {
  @ApiProperty({
    example: 'Aragorn',
    description: 'Nome do personagem (obrigatório, não único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/aragorn.jpg',
    description: 'URL de uma imagem de referência do personagem',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Herdeiro de Isildur e futuro rei de Gondor</p>',
    description: 'Descrição do personagem (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    default: false,
    example: false,
    description: 'Indica se o personagem está morto (padrão: false)',
  })
  @IsOptional()
  @IsBoolean()
  isDead?: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID da raça do personagem (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  raceId?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas ao personagem (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID da família primária do personagem (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  familyId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID da família secundária do personagem (opcional)',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  secondaryFamilyId?: string;
}
