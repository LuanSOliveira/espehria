import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CampaignSectionInputDto {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Ganchos de Aventura',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: 'Descrição da seção (suporta HTML)',
    example: '<p>Descreva o gancho de aventura aqui.</p>',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
