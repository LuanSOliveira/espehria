import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Race } from '../entities/race.entity';
import { RaceCategoryResponseDto } from './race-category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CharacteristicListItemResponseDto } from '../../characteristics/dto/characteristic-list-item-response.dto';
import { TalentListItemResponseDto } from '../../talents/dto/talent-list-item-response.dto';
import { ImprovementFlawItemResponseDto } from '../../improvement-flaws/dto/improvement-flaw-item-response.dto';

export class RaceResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da raça',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da raça',
    example: 'Elfo',
  })
  name: string;

  @ApiProperty({
    type: () => RaceCategoryResponseDto,
    description: 'Categoria da raça',
  })
  category: RaceCategoryResponseDto;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência da raça (pode ser nula se não informada)',
    example: 'https://exemplo.com/elfo.jpg',
  })
  referenceImageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da raça em HTML (pode ser nula se não informada)',
    example: '<p>Povo antigo, ligado à natureza e à magia</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas da raça em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à raça',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [CharacteristicListItemResponseDto],
    description:
      'Características associadas à raça (retornam id, name, level e tags para suportar filtro por level e exibição de tags no frontend)',
  })
  characteristics: CharacteristicListItemResponseDto[];

  @ApiProperty({
    type: () => [TalentListItemResponseDto],
    description:
      'Talentos associados à raça (retornam id, name, level e tags para suportar filtro por level e exibição de tags no frontend)',
  })
  talents: TalentListItemResponseDto[];

  @ApiProperty({
    type: () => [ImprovementFlawItemResponseDto],
    description:
      'Melhorias próprias desta raça, na ordem em que foram inseridas',
  })
  improvements: ImprovementFlawItemResponseDto[];

  @ApiProperty({
    type: () => [ImprovementFlawItemResponseDto],
    description:
      'Defeitos próprios desta raça, na ordem em que foram inseridos',
  })
  flaws: ImprovementFlawItemResponseDto[];

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-01-15T10:30:00Z',
  })
  updatedAt: Date;

  static fromEntity(
    race: Race,
    references: {
      improvements: ImprovementFlawItemResponseDto[];
      flaws: ImprovementFlawItemResponseDto[];
    } = { improvements: [], flaws: [] },
  ): RaceResponseDto {
    const dto = new RaceResponseDto();
    dto.id = race.id;
    dto.name = race.name;
    dto.category = RaceCategoryResponseDto.fromEntity(race.category);
    dto.referenceImageUrl = race.referenceImageUrl;
    dto.description = race.description;
    dto.privateInformation = race.privateInformation;
    dto.tags = (race.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.characteristics = (race.characteristics ?? []).map((characteristic) =>
      CharacteristicListItemResponseDto.fromEntity(characteristic),
    );
    dto.talents = (race.talents ?? []).map((talent) =>
      TalentListItemResponseDto.fromEntity(talent),
    );
    dto.improvements = references.improvements;
    dto.flaws = references.flaws;
    dto.createdAt = race.createdAt;
    dto.updatedAt = race.updatedAt;
    return dto;
  }
}
