import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sheet } from '../../sheets/entities/sheet.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class CampaignSheetResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador único da ficha' })
  id: string;

  @ApiProperty({ description: 'Nome da ficha' })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da ficha',
  })
  referenceImage: string | null;

  @ApiProperty({ description: 'Nível da ficha' })
  level: number;

  @ApiProperty({
    type: () => UserResponseDto,
    description: 'Usuário dono da ficha',
  })
  createdBy: UserResponseDto;

  static fromEntity(sheet: Sheet): CampaignSheetResponseDto {
    const dto = new CampaignSheetResponseDto();
    dto.id = sheet.id;
    dto.name = sheet.name;
    dto.referenceImage = sheet.referenceImage;
    dto.level = sheet.level;
    dto.createdBy = UserResponseDto.fromEntity(sheet.createdBy);
    return dto;
  }
}
