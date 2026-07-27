import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Character } from '../entities/character.entity';
import { RaceResponseDto } from '../../races/dto/race-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class CharacterListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do personagem',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do personagem',
    example: 'https://exemplo.com/aragorn.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do personagem',
    example: 'Aragorn',
  })
  name: string;

  @ApiProperty({ description: 'Indica se o personagem está morto' })
  isDead: boolean;

  @ApiPropertyOptional({
    type: () => RaceResponseDto,
    description: 'Raça do personagem (pode ser nula se não informada)',
  })
  race: RaceResponseDto | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao personagem',
  })
  tags: TagResponseDto[];

  static fromEntity(character: Character): CharacterListItemResponseDto {
    const dto = new CharacterListItemResponseDto();
    dto.id = character.id;
    dto.referenceImage = character.referenceImage;
    dto.name = character.name;
    dto.isDead = character.isDead;
    dto.race = character.race
      ? RaceResponseDto.fromEntity(character.race)
      : null;
    dto.tags = (character.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
