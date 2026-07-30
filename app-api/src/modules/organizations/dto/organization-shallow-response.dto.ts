import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../entities/organization.entity';

export class OrganizationShallowResponseDto {
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

  static fromEntity(
    organization: Organization,
  ): OrganizationShallowResponseDto {
    const dto = new OrganizationShallowResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.referenceImage = organization.referenceImage;
    return dto;
  }
}
