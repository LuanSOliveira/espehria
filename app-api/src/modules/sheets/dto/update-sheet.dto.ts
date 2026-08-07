import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSheetDto {
  @ApiPropertyOptional({
    example: 'Aragorn',
    description: 'Nome da ficha',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/ficha.jpg',
    nullable: true,
    description:
      'URL de uma imagem de referência da ficha. Omitir o campo mantém a imagem atual inalterada; enviar "null" explicitamente remove a imagem',
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string | null;

  @ApiPropertyOptional({
    minimum: 1,
    example: 2,
    description: 'Nível da ficha (número inteiro, mínimo 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O nível deve ser um número inteiro.' })
  @Min(1, { message: 'O nível deve ser maior ou igual a 1.' })
  level?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'ID da campanha vinculada à ficha. Omitir o campo mantém a campanha atual inalterada; enviar "null" explicitamente desvincula',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  campaignId?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'ID do atributo chave selecionado para a Classe de Armadura. Deve ser um dos ids retornados por GET /attributes. Omitir o campo mantém o atributo chave atual inalterado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  armorClassKeyAttributeId?: string;
}
