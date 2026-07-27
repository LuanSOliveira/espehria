import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../entities/organization.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class OrganizationListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da organização',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da organização',
    example: 'https://exemplo.com/guarda-cinzenta.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome da organização',
    example: 'Guarda Cinzenta',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à organização',
  })
  tags: TagResponseDto[];

  static fromEntity(organization: Organization): OrganizationListItemResponseDto {
    const dto = new OrganizationListItemResponseDto();
    dto.id = organization.id;
    dto.referenceImage = organization.referenceImage;
    dto.name = organization.name;
    dto.tags = (organization.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
