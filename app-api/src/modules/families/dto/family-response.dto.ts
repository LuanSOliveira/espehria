import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Family } from '../entities/family.entity';
import { FamilyClassification } from '../enums/family-classification.enum';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { FamilyMemberResponseDto } from './family-member-response.dto';
import { FamilyRelationshipResponseDto } from './family-relationship-response.dto';
import { CharacterShallowResponseDto } from '../../characters/dto/character-shallow-response.dto';
import { Character } from '../../characters/entities/character.entity';

export class FamilyResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da família',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da família',
    example: 'Casa Stark',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da família',
    example: 'https://exemplo.com/casa-stark.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da família em HTML',
    example: '<p>Antiga casa nobre que governa o norte</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas da família em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    enum: FamilyClassification,
    description: 'Classificação da família',
  })
  classification: FamilyClassification;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à família',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [FamilyMemberResponseDto],
    description: 'Membros posicionados na árvore genealógica',
  })
  members: FamilyMemberResponseDto[];

  @ApiProperty({
    type: () => [FamilyRelationshipResponseDto],
    description:
      'Vínculos de parentesco entre os membros da árvore genealógica',
  })
  relationships: FamilyRelationshipResponseDto[];

  @ApiProperty({
    type: () => [CharacterShallowResponseDto],
    description:
      'Personagens cuja família primária ou secundária é esta família, mas que ainda não possuem card posicionado na árvore. Campo derivado/somente leitura, calculado no service — não é aceito em requisições de criação/atualização',
  })
  looseCharacters: CharacterShallowResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(
    family: Family,
    looseCharacters: Character[] = [],
  ): FamilyResponseDto {
    const dto = new FamilyResponseDto();
    dto.id = family.id;
    dto.name = family.name;
    dto.referenceImage = family.referenceImage;
    dto.description = family.description;
    dto.privateInformation = family.privateInformation;
    dto.classification = family.classification;
    dto.tags = (family.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.members = (family.members ?? []).map((member) =>
      FamilyMemberResponseDto.fromEntity(member),
    );
    dto.relationships = (family.relationships ?? []).map((relationship) =>
      FamilyRelationshipResponseDto.fromEntity(relationship),
    );
    dto.looseCharacters = looseCharacters.map((character) =>
      CharacterShallowResponseDto.fromEntity(character),
    );
    dto.createdAt = family.createdAt;
    dto.updatedAt = family.updatedAt;
    return dto;
  }
}
