import { ApiProperty } from '@nestjs/swagger';
import { CharacterKinship } from '../entities/character-kinship.entity';
import { CharacterShallowResponseDto } from './character-shallow-response.dto';

export class CharacterKinshipResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do vínculo de parentesco',
  })
  id: string;

  @ApiProperty({
    description: 'Grau ou tipo de parentesco',
    example: 'Pai',
  })
  kinship: string;

  @ApiProperty({
    type: () => CharacterShallowResponseDto,
    description: 'Personagem parente referenciado',
  })
  relative: CharacterShallowResponseDto;

  static fromEntity(kinship: CharacterKinship): CharacterKinshipResponseDto {
    const dto = new CharacterKinshipResponseDto();
    dto.id = kinship.id;
    dto.kinship = kinship.kinship;
    dto.relative = CharacterShallowResponseDto.fromEntity(kinship.relative);
    return dto;
  }
}
