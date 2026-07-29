import { ApiProperty } from '@nestjs/swagger';
import { FamilyMember } from '../entities/family-member.entity';
import { CharacterShallowResponseDto } from '../../characters/dto/character-shallow-response.dto';

export class FamilyMemberResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do vínculo de membro',
  })
  id: string;

  @ApiProperty({
    description: 'Posição X do card no quadro da árvore genealógica',
    example: 120,
  })
  positionX: number;

  @ApiProperty({
    description: 'Posição Y do card no quadro da árvore genealógica',
    example: 80,
  })
  positionY: number;

  @ApiProperty({
    type: () => CharacterShallowResponseDto,
    description: 'Personagem membro',
  })
  character: CharacterShallowResponseDto;

  static fromEntity(member: FamilyMember): FamilyMemberResponseDto {
    const dto = new FamilyMemberResponseDto();
    dto.id = member.id;
    dto.positionX = member.positionX;
    dto.positionY = member.positionY;
    dto.character = CharacterShallowResponseDto.fromEntity(member.character);
    return dto;
  }
}
