import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Characteristic } from '../entities/characteristic.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { EntityReferenceResponseDto } from '../../entity-links/dto/entity-reference-response.dto';

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
    description: 'Tags associadas à característica',
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

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    characteristic: Characteristic,
    improvedFrom: EntityReferenceResponseDto[],
    requirements: EntityReferenceResponseDto[],
    additionalAbilities: EntityReferenceResponseDto[],
  ): CharacteristicResponseDto {
    const dto = new CharacteristicResponseDto();
    dto.id = characteristic.id;
    dto.name = characteristic.name;
    dto.level = characteristic.level;
    dto.description = characteristic.description;
    dto.tags = (characteristic.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.improvedFrom = improvedFrom;
    dto.requirements = requirements;
    dto.additionalAbilities = additionalAbilities;
    dto.createdAt = characteristic.createdAt;
    dto.updatedAt = characteristic.updatedAt;
    return dto;
  }
}
