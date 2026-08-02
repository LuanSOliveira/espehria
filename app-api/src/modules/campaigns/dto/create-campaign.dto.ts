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
import { CampaignSectionInputDto } from './campaign-section-input.dto';

export class CreateCampaignDto {
  @ApiProperty({
    example: 'A Sombra de Valgrim',
    description: 'Nome da campanha (obrigatório, único por usuário)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'https://exemplo.com/campanha.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImageUrl?: string;

  @ApiPropertyOptional({
    example: '<p>Uma campanha ambientada nas terras esquecidas de Valgrim.</p>',
    description: 'Descrição da campanha (suporta HTML)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs das tags associadas à campanha (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: () => [CampaignSectionInputDto],
    description:
      'Seções da campanha, criadas na ordem fornecida (array de seções)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignSectionInputDto)
  sections?: CampaignSectionInputDto[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs dos usuários Google autorizados a visualizar a campanha (array de UUIDs válidos, apenas usuários com provider Google)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedUserIds?: string[];
}
