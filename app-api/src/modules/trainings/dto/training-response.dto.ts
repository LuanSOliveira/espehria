import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Training } from '../entities/training.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EntityReferenceResponseDto } from '../../entity-links/dto/entity-reference-response.dto';
import { ImprovementFlawItemResponseDto } from '../../improvement-flaws/dto/improvement-flaw-item-response.dto';
import { ProficiencyItemResponseDto } from '../../proficiencies/dto/proficiency-item-response.dto';
import { KnowledgeItemResponseDto } from '../../knowledges/dto/knowledge-item-response.dto';

export class TrainingResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do treinamento',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do treinamento',
    example: 'Treinamento de Combate Corpo a Corpo',
  })
  name: string;

  @ApiProperty({ description: 'Nível do treinamento', example: 3 })
  level: number;

  @ApiPropertyOptional({
    description: 'Descrição do treinamento em HTML',
    example: '<p>Treinamento focado em técnicas de combate corpo a corpo</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao treinamento, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens dos quais este treinamento é aprimorado',
  })
  improvedFrom: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens exigidos como requisito para este treinamento',
  })
  requirements: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Habilidades adicionais associadas a este treinamento',
  })
  additionalAbilities: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [ImprovementFlawItemResponseDto],
    description:
      'Melhorias associadas a este treinamento, na ordem em que foram inseridas',
  })
  improvements: ImprovementFlawItemResponseDto[];

  @ApiProperty({
    type: () => [ImprovementFlawItemResponseDto],
    description:
      'Defeitos associados a este treinamento, na ordem em que foram inseridos',
  })
  flaws: ImprovementFlawItemResponseDto[];

  @ApiProperty({
    type: () => [ProficiencyItemResponseDto],
    description:
      'Proficiências associadas a este treinamento, na ordem em que foram inseridas',
  })
  proficiencies: ProficiencyItemResponseDto[];

  @ApiProperty({
    type: () => [KnowledgeItemResponseDto],
    description:
      'Saberes associados a este treinamento, na ordem em que foram inseridos',
  })
  knowledges: KnowledgeItemResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    training: Training,
    references: {
      improvedFrom: EntityReferenceResponseDto[];
      requirements: EntityReferenceResponseDto[];
      additionalAbilities: EntityReferenceResponseDto[];
      improvements: ImprovementFlawItemResponseDto[];
      flaws: ImprovementFlawItemResponseDto[];
      proficiencies: ProficiencyItemResponseDto[];
      knowledges: KnowledgeItemResponseDto[];
    },
  ): TrainingResponseDto {
    const dto = new TrainingResponseDto();
    dto.id = training.id;
    dto.name = training.name;
    dto.level = training.level;
    dto.description = training.description;
    dto.tags = (training.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.improvedFrom = references.improvedFrom;
    dto.requirements = references.requirements;
    dto.additionalAbilities = references.additionalAbilities;
    dto.improvements = references.improvements;
    dto.flaws = references.flaws;
    dto.proficiencies = references.proficiencies;
    dto.knowledges = references.knowledges;
    dto.createdAt = training.createdAt;
    dto.updatedAt = training.updatedAt;
    return dto;
  }
}
