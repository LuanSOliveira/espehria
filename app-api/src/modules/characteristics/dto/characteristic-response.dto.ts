import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Characteristic } from '../entities/characteristic.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EntityReferenceResponseDto } from '../../entity-links/dto/entity-reference-response.dto';
import { ImprovementFlawItemResponseDto } from '../../improvement-flaws/dto/improvement-flaw-item-response.dto';
import { ProficiencyItemResponseDto } from '../../proficiencies/dto/proficiency-item-response.dto';
import { KnowledgeItemResponseDto } from '../../knowledges/dto/knowledge-item-response.dto';

export class CharacteristicResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da característica',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da característica',
    example: 'Força',
  })
  name: string;

  @ApiProperty({ description: 'Nível da característica', example: 3 })
  level: number;

  @ApiPropertyOptional({
    description: 'Descrição da característica em HTML',
    example: '<p>Medida do vigor físico do personagem</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à característica, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens dos quais esta característica é aprimorada',
  })
  improvedFrom: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens exigidos como requisito para esta característica',
  })
  requirements: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Habilidades adicionais associadas a esta característica',
  })
  additionalAbilities: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [ImprovementFlawItemResponseDto],
    description:
      'Melhorias associadas a esta característica, na ordem em que foram inseridas',
  })
  improvements: ImprovementFlawItemResponseDto[];

  @ApiProperty({
    type: () => [ImprovementFlawItemResponseDto],
    description:
      'Defeitos associados a esta característica, na ordem em que foram inseridos',
  })
  flaws: ImprovementFlawItemResponseDto[];

  @ApiProperty({
    type: () => [ProficiencyItemResponseDto],
    description:
      'Proficiências associadas a esta característica, na ordem em que foram inseridas',
  })
  proficiencies: ProficiencyItemResponseDto[];

  @ApiProperty({
    type: () => [KnowledgeItemResponseDto],
    description:
      'Saberes associados a esta característica, na ordem em que foram inseridos',
  })
  knowledges: KnowledgeItemResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    characteristic: Characteristic,
    references: {
      improvedFrom: EntityReferenceResponseDto[];
      requirements: EntityReferenceResponseDto[];
      additionalAbilities: EntityReferenceResponseDto[];
      improvements: ImprovementFlawItemResponseDto[];
      flaws: ImprovementFlawItemResponseDto[];
      proficiencies: ProficiencyItemResponseDto[];
      knowledges: KnowledgeItemResponseDto[];
    },
  ): CharacteristicResponseDto {
    const dto = new CharacteristicResponseDto();
    dto.id = characteristic.id;
    dto.name = characteristic.name;
    dto.level = characteristic.level;
    dto.description = characteristic.description;
    dto.tags = (characteristic.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.improvedFrom = references.improvedFrom;
    dto.requirements = references.requirements;
    dto.additionalAbilities = references.additionalAbilities;
    dto.improvements = references.improvements;
    dto.flaws = references.flaws;
    dto.proficiencies = references.proficiencies;
    dto.knowledges = references.knowledges;
    dto.createdAt = characteristic.createdAt;
    dto.updatedAt = characteristic.updatedAt;
    return dto;
  }
}
