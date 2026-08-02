import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignOptionResponseDto } from '../../campaigns/dto/campaign-option-response.dto';
import { Sheet } from '../entities/sheet.entity';

export class SheetListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da ficha',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da ficha',
    example: 'Aragorn',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da ficha',
    example: 'https://exemplo.com/ficha.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nível da ficha',
    example: 1,
  })
  level: number;

  @ApiPropertyOptional({
    type: () => CampaignOptionResponseDto,
    description: 'Campanha vinculada à ficha (pode ser nula se não informada)',
  })
  campaign: CampaignOptionResponseDto | null;

  static fromEntity(sheet: Sheet): SheetListItemResponseDto {
    const dto = new SheetListItemResponseDto();
    dto.id = sheet.id;
    dto.name = sheet.name;
    dto.referenceImage = sheet.referenceImage;
    dto.level = sheet.level;
    dto.campaign = sheet.campaign
      ? CampaignOptionResponseDto.fromEntity(sheet.campaign)
      : null;
    return dto;
  }
}
