import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    example: 'Urgente',
    description: 'Nome da tag (deve ser único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '#FF5733',
    description: 'Cor da tag em formato hexadecimal #RRGGBB',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#([0-9A-Fa-f]{6})$/, {
    message: 'A cor deve estar no formato hexadecimal #RRGGBB.',
  })
  color: string;

  @ApiPropertyOptional({
    description: 'Tipo da tag (campo livre, opcional)',
    example: 'Monstro',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;
}
