import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LocationSectionInputDto {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Flora Local',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: 'Descrição da seção (suporta HTML)',
    example: '<p>Describe the local flora and fauna here.</p>',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
