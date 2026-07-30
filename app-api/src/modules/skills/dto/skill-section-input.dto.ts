import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SkillSectionInputDto {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Usos Comuns',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: 'Descrição da seção (suporta HTML)',
    example: '<p>Descreva os usos comuns da perícia aqui.</p>',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
