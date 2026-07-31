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
import { SkillSectionInputDto } from './skill-section-input.dto';

export class CreateSkillDto {
  @ApiProperty({
    example: 'Furtividade',
    description: 'Nome da perícia (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '<p>Capacidade de se mover sem ser percebido.</p>',
    description: 'Descrição da perícia (suporta HTML)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID do atributo chave da perícia (obrigatório)',
  })
  @IsUUID()
  keyAttributeId: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à perícia (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: () => [SkillSectionInputDto],
    description:
      'Seções da perícia, criadas na ordem fornecida (array de seções)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillSectionInputDto)
  sections?: SkillSectionInputDto[];
}
