import { ApiProperty } from '@nestjs/swagger';
import { FamilyRelationship } from '../entities/family-relationship.entity';
import { FamilyRelationshipType } from '../enums/family-relationship-type.enum';
import { CharacterShallowResponseDto } from '../../characters/dto/character-shallow-response.dto';

export class FamilyRelationshipResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do vínculo de parentesco',
  })
  id: string;

  @ApiProperty({
    enum: FamilyRelationshipType,
    description: 'Tipo do vínculo de parentesco',
  })
  type: FamilyRelationshipType;

  @ApiProperty({
    type: () => CharacterShallowResponseDto,
    description: 'Personagem de origem do vínculo',
  })
  sourceCharacter: CharacterShallowResponseDto;

  @ApiProperty({
    type: () => CharacterShallowResponseDto,
    description: 'Personagem de destino do vínculo',
  })
  targetCharacter: CharacterShallowResponseDto;

  static fromEntity(
    relationship: FamilyRelationship,
  ): FamilyRelationshipResponseDto {
    const dto = new FamilyRelationshipResponseDto();
    dto.id = relationship.id;
    dto.type = relationship.type;
    dto.sourceCharacter = CharacterShallowResponseDto.fromEntity(
      relationship.sourceCharacter,
    );
    dto.targetCharacter = CharacterShallowResponseDto.fromEntity(
      relationship.targetCharacter,
    );
    return dto;
  }
}
