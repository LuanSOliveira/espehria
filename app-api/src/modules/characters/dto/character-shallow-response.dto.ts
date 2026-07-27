import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Character } from '../entities/character.entity';

export class CharacterShallowResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do personagem',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do personagem',
    example: 'Aragorn',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do personagem',
    example: 'https://exemplo.com/aragorn.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({ description: 'Indica se o personagem está morto' })
  isDead: boolean;

  static fromEntity(character: Character): CharacterShallowResponseDto {
    const dto = new CharacterShallowResponseDto();
    dto.id = character.id;
    dto.name = character.name;
    dto.referenceImage = character.referenceImage;
    dto.isDead = character.isDead;
    return dto;
  }
}
