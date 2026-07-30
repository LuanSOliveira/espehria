import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RuleSectionInputDto {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Iniciativa',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: 'Descrição da seção (suporta HTML)',
    example: '<p>Descreva as regras de iniciativa aqui.</p>',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
