import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateCreatureDto {
  @ApiProperty({ example: 'Dragão Vermelho' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'https://exemplo.com/dragao.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImageUrl?: string;

  @ApiPropertyOptional({ example: 'Dragão Escarlate, Dragão de Fogo' })
  @IsOptional()
  @IsString()
  otherNames?: string;

  @ApiPropertyOptional({ example: 'Alto' })
  @IsOptional()
  @IsString()
  threatLevel?: string;

  @ApiPropertyOptional({ example: '500 anos' })
  @IsOptional()
  @IsString()
  averageLifeExpectancy?: string;

  @ApiProperty({ example: '<p>Corpo alargado coberto de escamas vermelhas brilhantes</p>' })
  @IsString()
  @IsNotEmpty()
  physicalCharacteristics: string;

  @ApiPropertyOptional({ example: '<p>Montanhas vulcânicas e cavernas subterrâneas</p>' })
  @IsOptional()
  @IsString()
  habitat?: string;

  @ApiPropertyOptional({ example: '<p>Predador territorial e agressivo</p>' })
  @IsOptional()
  @IsString()
  behavior?: string;

  @ApiPropertyOptional({ example: '<p>Carnívoro: ovelhas, cabras e gado</p>' })
  @IsOptional()
  @IsString()
  diet?: string;

  @ApiPropertyOptional({ example: '<p>Longevidade extrema com fases bem definidas</p>' })
  @IsOptional()
  @IsString()
  lifeCycle?: string;

  @ApiPropertyOptional({ example: '<p>Filhotes medem 2 metros, sem capacidade de voo</p>' })
  @IsOptional()
  @IsString()
  lifeStageInfant?: string;

  @ApiPropertyOptional({ example: '<p>Adolescentes de 10-15 metros começam a voar</p>' })
  @IsOptional()
  @IsString()
  lifeStageYoung?: string;

  @ApiPropertyOptional({ example: '<p>Adultos de 20 metros completamente maduros</p>' })
  @IsOptional()
  @IsString()
  lifeStageAdult?: string;

  @ApiPropertyOptional({ example: '<p>Anciões com mais de 400 anos, menos ativos</p>' })
  @IsOptional()
  @IsString()
  lifeStageElder?: string;

  @ApiPropertyOptional({ example: '<p>Voo impossível de alcançar, expele fogo</p>' })
  @IsOptional()
  @IsString()
  abilitiesAndPowers?: string;

  @ApiPropertyOptional({ example: '<p>Imune a calor extremo e fogo</p>' })
  @IsOptional()
  @IsString()
  resistances?: string;

  @ApiPropertyOptional({ example: '<p>Água fria e mágica de gelo</p>' })
  @IsOptional()
  @IsString()
  weaknesses?: string;

  @ApiPropertyOptional({ example: '<p>Combate aéreo com chamas e garras</p>' })
  @IsOptional()
  @IsString()
  combat?: string;

  @ApiPropertyOptional({ example: '<p>Investida com garras, ataque com fogo</p>' })
  @IsOptional()
  @IsString()
  attackMethods?: string;

  @ApiPropertyOptional({ example: '<p>Estratégia de intimidação e dominação</p>' })
  @IsOptional()
  @IsString()
  strategy?: string;

  @ApiPropertyOptional({ example: '<p>Perigo extremo, evitar confronto direto</p>' })
  @IsOptional()
  @IsString()
  dangerDegree?: string;

  @ApiPropertyOptional({ example: '<p>Escamas, dentes, ouro acumulado</p>' })
  @IsOptional()
  @IsString()
  obtainedResources?: string;

  @ApiPropertyOptional({ example: '<p>Altíssimo valor pelas escamas e ouro</p>' })
  @IsOptional()
  @IsString()
  commercialValue?: string;

  @ApiPropertyOptional({ example: '<p>Símbolo de poder e riqueza nas civilizações</p>' })
  @IsOptional()
  @IsString()
  relationWithCivilizations?: string;

  @ApiPropertyOptional({ example: '<p>Mencionado em lendas heróicas e épicos antigos</p>' })
  @IsOptional()
  @IsString()
  mythologyAndFolklore?: string;

  @ApiPropertyOptional({ example: '<p>Avistamentos frequentes na região norte</p>' })
  @IsOptional()
  @IsString()
  encounterRecord?: string;

  @ApiPropertyOptional({ example: '<p>Estudos indicam inteligência comparável à humana</p>' })
  @IsOptional()
  @IsString()
  scholarsCuriosity?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à criatura',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
