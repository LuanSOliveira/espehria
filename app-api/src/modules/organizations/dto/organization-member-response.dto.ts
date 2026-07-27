import { ApiProperty } from '@nestjs/swagger';
import { OrganizationMember } from '../entities/organization-member.entity';
import { CharacterShallowResponseDto } from '../../characters/dto/character-shallow-response.dto';

export class OrganizationMemberResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do vínculo de membro',
  })
  id: string;

  @ApiProperty({
    description: 'Função exercida na organização',
    example: 'Líder',
  })
  role: string;

  @ApiProperty({
    type: () => CharacterShallowResponseDto,
    description: 'Personagem membro',
  })
  character: CharacterShallowResponseDto;

  static fromEntity(
    member: OrganizationMember,
  ): OrganizationMemberResponseDto {
    const dto = new OrganizationMemberResponseDto();
    dto.id = member.id;
    dto.role = member.role;
    dto.character = CharacterShallowResponseDto.fromEntity(member.character);
    return dto;
  }
}
