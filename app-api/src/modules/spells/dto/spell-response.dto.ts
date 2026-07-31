import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Spell } from '../entities/spell.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

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
    description: 'Tags associadas à magia',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(spell: Spell): SpellResponseDto {
    const dto = new SpellResponseDto();
    dto.id = spell.id;
    dto.name = spell.name;
    dto.referenceImage = spell.referenceImage;
    dto.description = spell.description;
    dto.tags = (spell.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.createdAt = spell.createdAt;
    dto.updatedAt = spell.updatedAt;
    return dto;
  }
}
