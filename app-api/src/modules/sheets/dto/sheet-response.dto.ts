import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignOptionResponseDto } from '../../campaigns/dto/campaign-option-response.dto';
import { RaceResponseDto } from '../../races/dto/race-response.dto';
import { BiographyOptionResponseDto } from '../../biographies/dto/biography-option-response.dto';
import { AttributeResponseDto } from '../../attributes/dto/attribute-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { Sheet } from '../entities/sheet.entity';
import { SheetImprovementFlawSnapshotResponseDto } from './sheet-improvement-flaw-snapshot-response.dto';
import { SheetProficiencySnapshotResponseDto } from './sheet-proficiency-snapshot-response.dto';
import { SheetProficiencyAdjustmentResponseDto } from './sheet-proficiency-adjustment-response.dto';
import { SheetKnowledgeSnapshotResponseDto } from './sheet-knowledge-snapshot-response.dto';

export class SheetResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da ficha',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da ficha',
    example: 'Aragorn',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da ficha',
    example: 'https://exemplo.com/ficha.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nível da ficha',
    example: 1,
  })
  level: number;

  @ApiPropertyOptional({
    description: 'PV atual da ficha (pode ser nulo se não informado)',
    example: 12,
  })
  currentHitPoints: number | null;

  @ApiPropertyOptional({
    description: 'PV temporário da ficha (pode ser nulo se não informado)',
    example: 5,
  })
  temporaryHitPoints: number | null;

  @ApiProperty({
    description: 'Quantidade de Peças de Cobre (PC) da ficha',
    example: 0,
  })
  pc: number;

  @ApiProperty({
    description: 'Quantidade de Peças de Prata (PP) da ficha',
    example: 0,
  })
  pp: number;

  @ApiProperty({
    description: 'Quantidade de Peças de Ouro (PO) da ficha',
    example: 0,
  })
  po: number;

  @ApiProperty({
    description: 'Quantidade de Peças de Platina (PL) da ficha',
    example: 0,
  })
  pl: number;

  @ApiProperty({
    description:
      'Volume Carregado da ficha (decimal, no máximo 1 casa decimal) — floor(moedas / 1000) + itemsVolume',
    example: 0,
  })
  loadedVolume: number;

  @ApiProperty({
    description:
      'Volume vindo dos itens do inventário da ficha (decimal, no máximo 1 casa decimal). Campo somente leitura — escrito exclusivamente pelos endpoints de /sheets/:id/inventory-items',
    example: 0,
  })
  itemsVolume: number;

  @ApiPropertyOptional({
    type: () => CampaignOptionResponseDto,
    description: 'Campanha vinculada à ficha (pode ser nula se não informada)',
  })
  campaign: CampaignOptionResponseDto | null;

  @ApiPropertyOptional({
    type: () => RaceResponseDto,
    description: 'Raça vinculada à ficha (pode ser nula se não informada)',
  })
  race: RaceResponseDto | null;

  @ApiPropertyOptional({
    type: () => BiographyOptionResponseDto,
    description: 'Biografia vinculada à ficha (pode ser nula se não informada)',
  })
  biography: BiographyOptionResponseDto | null;

  @ApiProperty({
    type: () => AttributeResponseDto,
    description:
      'Atributo chave selecionado para a Classe de Armadura (10 + modificador deste atributo é a Classe de Armadura base, calculada no client)',
  })
  armorClassKeyAttribute: AttributeResponseDto;

  @ApiProperty({
    type: () => SheetImprovementFlawSnapshotResponseDto,
    description:
      'Snapshot das melhorias da ficha, agrupadas por categoria de origem',
  })
  melhorias: SheetImprovementFlawSnapshotResponseDto;

  @ApiProperty({
    type: () => SheetImprovementFlawSnapshotResponseDto,
    description:
      'Snapshot dos defeitos da ficha, agrupados por categoria de origem',
  })
  defeitos: SheetImprovementFlawSnapshotResponseDto;

  @ApiProperty({
    type: () => SheetProficiencySnapshotResponseDto,
    description:
      'Snapshot das proficiências efetivas da ficha, agrupadas por origem',
  })
  proficiencias: SheetProficiencySnapshotResponseDto;

  @ApiProperty({
    type: () => [SheetProficiencyAdjustmentResponseDto],
    description:
      'Proficiências em conflito que aguardam ou já receberam uma propriedade substituta',
  })
  proficienciasAjustadas: SheetProficiencyAdjustmentResponseDto[];

  @ApiProperty({
    type: () => SheetKnowledgeSnapshotResponseDto,
    description: 'Snapshot dos saberes efetivos da ficha, agrupados por origem',
  })
  saberes: SheetKnowledgeSnapshotResponseDto;

  @ApiProperty({
    type: () => UserResponseDto,
    description:
      'Usuário dono da ficha. Campo somente leitura — preenchido a partir do usuário autenticado na criação',
  })
  createdBy: UserResponseDto;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(sheet: Sheet): SheetResponseDto {
    const dto = new SheetResponseDto();
    dto.id = sheet.id;
    dto.name = sheet.name;
    dto.referenceImage = sheet.referenceImage;
    dto.level = sheet.level;
    dto.currentHitPoints = sheet.currentHitPoints;
    dto.temporaryHitPoints = sheet.temporaryHitPoints;
    dto.pc = sheet.pc;
    dto.pp = sheet.pp;
    dto.po = sheet.po;
    dto.pl = sheet.pl;
    dto.loadedVolume = sheet.loadedVolume;
    dto.itemsVolume = sheet.itemsVolume;
    dto.campaign = sheet.campaign
      ? CampaignOptionResponseDto.fromEntity(sheet.campaign)
      : null;
    dto.race = sheet.race ? RaceResponseDto.fromEntity(sheet.race) : null;
    dto.biography = sheet.biography
      ? BiographyOptionResponseDto.fromEntity(sheet.biography)
      : null;
    dto.armorClassKeyAttribute = AttributeResponseDto.fromEntity(
      sheet.armorClassKeyAttribute,
    );
    dto.melhorias = SheetImprovementFlawSnapshotResponseDto.fromEntity(
      sheet.melhorias,
    );
    dto.defeitos = SheetImprovementFlawSnapshotResponseDto.fromEntity(
      sheet.defeitos,
    );
    dto.proficiencias = SheetProficiencySnapshotResponseDto.fromEntity(
      sheet.proficiencias,
    );
    dto.proficienciasAjustadas = sheet.proficienciasAjustadas.map(
      (adjustment) => SheetProficiencyAdjustmentResponseDto.fromRaw(adjustment),
    );
    dto.saberes = SheetKnowledgeSnapshotResponseDto.fromEntity(
      sheet.saberes,
      sheet.saberesAnotacoes,
    );
    dto.createdBy = UserResponseDto.fromEntity(sheet.createdBy);
    dto.createdAt = sheet.createdAt;
    dto.updatedAt = sheet.updatedAt;
    return dto;
  }
}
