import { ApiProperty } from '@nestjs/swagger';
import { Campaign } from '../entities/campaign.entity';

export class CampaignOptionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da campanha',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da campanha',
    example: 'A Sombra de Valgrim',
  })
  name: string;

  static fromEntity(campaign: Campaign): CampaignOptionResponseDto {
    const dto = new CampaignOptionResponseDto();
    dto.id = campaign.id;
    dto.name = campaign.name;
    return dto;
  }
}
