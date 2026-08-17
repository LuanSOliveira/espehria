import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EnhancementType } from '../enums/enhancement-type.enum';

export class CreateEnhancementDto {
  @ApiProperty({
    example: 'Reforçado',
    description: 'Nome do aprimoramento (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    enum: EnhancementType,
    description: 'Tipo do aprimoramento',
  })
  @IsOptional()
  @IsEnum(EnhancementType)
  type?: EnhancementType;

  @ApiPropertyOptional({
    example: '<p>Aumenta a resistência do item</p>',
    description: 'Efeito do aprimoramento (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  effect?: string;
}
