import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PlannedSessionSectionInputDto {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Resumo da Sessão',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: 'Descrição da seção (suporta HTML)',
    example: '<p>Descreva o resumo da sessão aqui.</p>',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
