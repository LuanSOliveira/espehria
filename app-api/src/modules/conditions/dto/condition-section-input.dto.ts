import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConditionSectionInputDto {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Efeitos',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: 'Descrição da seção (suporta HTML)',
    example: '<p>Descreva os efeitos da condição aqui.</p>',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
