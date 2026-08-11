import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Spell } from '../entities/spell.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EntityReferenceResponseDto } from '../../entity-links/dto/entity-reference-response.dto';

export class SpellResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da magia',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da magia',
    example: 'Bola de Fogo',
  })
  name: string;

  @ApiProperty({ description: 'Nível da magia', example: 3 })
  level: number;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da magia',
    example: 'https://exemplo.com/bola-de-fogo.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da magia em HTML',
    example: '<p>Uma esfera flamejante que explode ao impacto</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à magia, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens exigidos como requisito para esta magia',
  })
  requirements: EntityReferenceResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    spell: Spell,
    requirements: EntityReferenceResponseDto[],
  ): SpellResponseDto {
    const dto = new SpellResponseDto();
    dto.id = spell.id;
    dto.name = spell.name;
    dto.level = spell.level;
    dto.referenceImage = spell.referenceImage;
    dto.description = spell.description;
    dto.tags = (spell.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.requirements = requirements;
    dto.createdAt = spell.createdAt;
    dto.updatedAt = spell.updatedAt;
    return dto;
  }
}
