import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../entities/organization.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { OrganizationMemberResponseDto } from './organization-member-response.dto';

export class OrganizationResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da organização',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da organização',
    example: 'Guarda Cinzenta',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da organização',
    example: 'https://exemplo.com/guarda-cinzenta.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da organização em HTML',
    example: '<p>Ordem secreta que protege o reino nas sombras</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas da organização em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à organização',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [OrganizationMemberResponseDto],
    description: 'Membros da organização',
  })
  members: OrganizationMemberResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(organization: Organization): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.referenceImage = organization.referenceImage;
    dto.description = organization.description;
    dto.privateInformation = organization.privateInformation;
    dto.tags = (organization.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.members = (organization.members ?? []).map((member) =>
      OrganizationMemberResponseDto.fromEntity(member),
    );
    dto.createdAt = organization.createdAt;
    dto.updatedAt = organization.updatedAt;
    return dto;
  }
}
