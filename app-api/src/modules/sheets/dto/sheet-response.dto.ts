import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignOptionResponseDto } from '../../campaigns/dto/campaign-option-response.dto';
import { RaceResponseDto } from '../../races/dto/race-response.dto';
import { BiographyOptionResponseDto } from '../../biographies/dto/biography-option-response.dto';
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
    dto.campaign = sheet.campaign
      ? CampaignOptionResponseDto.fromEntity(sheet.campaign)
      : null;
    dto.race = sheet.race ? RaceResponseDto.fromEntity(sheet.race) : null;
    dto.biography = sheet.biography
      ? BiographyOptionResponseDto.fromEntity(sheet.biography)
      : null;
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
      (adjustment) =>
        SheetProficiencyAdjustmentResponseDto.fromRaw(adjustment),
    );
    dto.saberes = SheetKnowledgeSnapshotResponseDto.fromEntity(sheet.saberes);
    dto.createdBy = UserResponseDto.fromEntity(sheet.createdBy);
    dto.createdAt = sheet.createdAt;
    dto.updatedAt = sheet.updatedAt;
    return dto;
  }
}
