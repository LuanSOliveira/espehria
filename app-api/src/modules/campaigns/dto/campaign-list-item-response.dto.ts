import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Campaign } from '../entities/campaign.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class CampaignListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da campanha',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da campanha',
    example: 'https://exemplo.com/campanha.jpg',
  })
  referenceImageUrl: string | null;

  @ApiProperty({
    description: 'Nome da campanha',
    example: 'A Sombra de Valgrim',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à campanha',
  })
  tags: TagResponseDto[];

  static fromEntity(campaign: Campaign): CampaignListItemResponseDto {
    const dto = new CampaignListItemResponseDto();
    dto.id = campaign.id;
    dto.referenceImageUrl = campaign.referenceImageUrl;
    dto.name = campaign.name;
    dto.tags = (campaign.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
