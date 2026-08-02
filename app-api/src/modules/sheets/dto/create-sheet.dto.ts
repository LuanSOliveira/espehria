import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateSheetDto {
  @ApiProperty({
    example: 'Aragorn',
    description: 'Nome da ficha (obrigatório, não único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/ficha.jpg',
    description: 'URL de uma imagem de referência da ficha',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID da campanha vinculada à ficha (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}
