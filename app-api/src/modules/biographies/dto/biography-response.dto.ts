import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Biography } from '../entities/biography.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EntityReferenceResponseDto } from '../../entity-links/dto/entity-reference-response.dto';
import { ImprovementFlawItemResponseDto } from '../../improvement-flaws/dto/improvement-flaw-item-response.dto';
import { ProficiencyItemResponseDto } from '../../proficiencies/dto/proficiency-item-response.dto';
import { KnowledgeItemResponseDto } from '../../knowledges/dto/knowledge-item-response.dto';

export class BiographyResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da biografia',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da biografia',
    example: 'Biografia do Herói Esquecido',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da biografia em HTML',
    example: '<p>História de vida do herói esquecido pelo tempo</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da biografia',
    example: 'https://example.com/imagens/biografia.png',
  })
  imageReference: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à biografia, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Habilidades adicionais associadas a esta biografia',
  })
  additionalAbilities: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [ImprovementFlawItemResponseDto],
    description:
      'Melhorias associadas a esta biografia, na ordem em que foram inseridas',
  })
  improvements: ImprovementFlawItemResponseDto[];

  @ApiProperty({
    type: () => [ProficiencyItemResponseDto],
    description:
      'Proficiências associadas a esta biografia, na ordem em que foram inseridas',
  })
  proficiencies: ProficiencyItemResponseDto[];

  @ApiProperty({
    type: () => [KnowledgeItemResponseDto],
    description:
      'Saberes associados a esta biografia, na ordem em que foram inseridos',
  })
  knowledges: KnowledgeItemResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    biography: Biography,
    references: {
      additionalAbilities: EntityReferenceResponseDto[];
      improvements: ImprovementFlawItemResponseDto[];
      proficiencies: ProficiencyItemResponseDto[];
      knowledges: KnowledgeItemResponseDto[];
    },
  ): BiographyResponseDto {
    const dto = new BiographyResponseDto();
    dto.id = biography.id;
    dto.name = biography.name;
    dto.description = biography.description;
    dto.imageReference = biography.imageReference;
    dto.tags = (biography.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.additionalAbilities = references.additionalAbilities;
    dto.improvements = references.improvements;
    dto.proficiencies = references.proficiencies;
    dto.knowledges = references.knowledges;
    dto.createdAt = biography.createdAt;
    dto.updatedAt = biography.updatedAt;
    return dto;
  }
}
