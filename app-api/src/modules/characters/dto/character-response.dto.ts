import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Character } from '../entities/character.entity';
import { RaceResponseDto } from '../../races/dto/race-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { CharacterKinshipResponseDto } from './character-kinship-response.dto';
import { OrganizationShallowResponseDto } from '../../organizations/dto/organization-shallow-response.dto';
import { Organization } from '../../organizations/entities/organization.entity';

export class CharacterResponseDto {
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

  @ApiPropertyOptional({
    description: 'Descrição do personagem em HTML',
    example: '<p>Herdeiro de Isildur e futuro rei de Gondor</p>',
  })
  description: string | null;

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

  @ApiProperty({
    type: () => [CharacterKinshipResponseDto],
    description: 'Parentescos do personagem',
  })
  kinships: CharacterKinshipResponseDto[];

  @ApiProperty({
    type: () => [OrganizationShallowResponseDto],
    description:
      'Organizações das quais o personagem participa como membro. Campo derivado/somente leitura, calculado a partir dos vínculos de membro de organização — não é aceito em requisições de criação/atualização',
  })
  organizations: OrganizationShallowResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    character: Character,
    organizations: Organization[] = [],
  ): CharacterResponseDto {
    const dto = new CharacterResponseDto();
    dto.id = character.id;
    dto.name = character.name;
    dto.referenceImage = character.referenceImage;
    dto.description = character.description;
    dto.isDead = character.isDead;
    dto.race = character.race
      ? RaceResponseDto.fromEntity(character.race)
      : null;
    dto.tags = (character.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.kinships = (character.kinships ?? []).map((kinship) =>
      CharacterKinshipResponseDto.fromEntity(kinship),
    );
    dto.organizations = organizations.map((organization) =>
      OrganizationShallowResponseDto.fromEntity(organization),
    );
    dto.createdAt = character.createdAt;
    dto.updatedAt = character.updatedAt;
    return dto;
  }
}
