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

  @ApiPropertyOptional({
    nullable: true,
    example: 12,
    description:
      'PV atual da ficha (inteiro, aceita negativos). Omitir o campo mantém o valor atual inalterado; enviar "null" explicitamente limpa o campo',
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Type(() => Number)
  @IsInt({ message: 'O PV atual deve ser um número inteiro.' })
  currentHitPoints?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 5,
    description:
      'PV temporário da ficha (inteiro, aceita negativos). Omitir o campo mantém o valor atual inalterado; enviar "null" explicitamente limpa o campo',
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Type(() => Number)
  @IsInt({ message: 'O PV temporário deve ser um número inteiro.' })
  temporaryHitPoints?: number | null;

  @ApiPropertyOptional({
    minimum: 0,
    example: 0,
    description: 'Quantidade de Peças de Cobre (PC) da ficha (inteiro >= 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A quantidade de Peças de Cobre deve ser um número inteiro.' })
  @Min(0, {
    message: 'A quantidade de Peças de Cobre deve ser maior ou igual a 0.',
  })
  pc?: number;

  @ApiPropertyOptional({
    minimum: 0,
    example: 0,
    description: 'Quantidade de Peças de Prata (PP) da ficha (inteiro >= 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A quantidade de Peças de Prata deve ser um número inteiro.' })
  @Min(0, {
    message: 'A quantidade de Peças de Prata deve ser maior ou igual a 0.',
  })
  pp?: number;

  @ApiPropertyOptional({
    minimum: 0,
    example: 0,
    description: 'Quantidade de Peças de Ouro (PO) da ficha (inteiro >= 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A quantidade de Peças de Ouro deve ser um número inteiro.' })
  @Min(0, {
    message: 'A quantidade de Peças de Ouro deve ser maior ou igual a 0.',
  })
  po?: number;

  @ApiPropertyOptional({
    minimum: 0,
    example: 0,
    description: 'Quantidade de Peças de Platina (PL) da ficha (inteiro >= 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'A quantidade de Peças de Platina deve ser um número inteiro.',
  })
  @Min(0, {
    message: 'A quantidade de Peças de Platina deve ser maior ou igual a 0.',
  })
  pl?: number;

  @ApiPropertyOptional({
    minimum: 0,
    example: 0,
    description: 'Volume Carregado da ficha (inteiro >= 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O Volume Carregado deve ser um número inteiro.' })
  @Min(0, { message: 'O Volume Carregado deve ser maior ou igual a 0.' })
  loadedVolume?: number;
}
