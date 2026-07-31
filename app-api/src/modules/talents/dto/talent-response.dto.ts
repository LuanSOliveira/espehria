import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Talent } from '../entities/talent.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EntityReferenceResponseDto } from '../../entity-links/dto/entity-reference-response.dto';

export class TalentResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do talento',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do talento',
    example: 'Talento para Persuasão',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do talento em HTML',
    example: '<p>Facilidade natural em convencer outras pessoas</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao talento',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens dos quais este talento é aprimorado',
  })
  improvedFrom: EntityReferenceResponseDto[];

  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Itens exigidos como requisito para este talento',
  })
  requirements: EntityReferenceResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    talent: Talent,
    improvedFrom: EntityReferenceResponseDto[],
    requirements: EntityReferenceResponseDto[],
  ): TalentResponseDto {
    const dto = new TalentResponseDto();
    dto.id = talent.id;
    dto.name = talent.name;
    dto.description = talent.description;
    dto.tags = (talent.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.improvedFrom = improvedFrom;
    dto.requirements = requirements;
    dto.createdAt = talent.createdAt;
    dto.updatedAt = talent.updatedAt;
    return dto;
  }
}
