import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Campaign } from '../entities/campaign.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { CampaignSectionResponseDto } from './campaign-section-response.dto';

export class CampaignResponseDto {
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

  @ApiPropertyOptional({
    description: 'Descrição da campanha (HTML)',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à campanha',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [CampaignSectionResponseDto],
    description: 'Seções da campanha',
  })
  sections: CampaignSectionResponseDto[];

  @ApiProperty({
    type: () => UserResponseDto,
    description:
      'Usuário dono da campanha. Campo somente leitura — preenchido a partir do usuário autenticado na criação',
  })
  createdBy: UserResponseDto;

  @ApiProperty({
    type: () => [UserResponseDto],
    description:
      'Usuários Google autorizados a visualizar a campanha no contexto de fichas',
  })
  allowedUsers: UserResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(campaign: Campaign): CampaignResponseDto {
    const dto = new CampaignResponseDto();
    dto.id = campaign.id;
    dto.referenceImageUrl = campaign.referenceImageUrl;
    dto.name = campaign.name;
    dto.description = campaign.description;
    dto.tags = (campaign.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.sections = (campaign.sections ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => CampaignSectionResponseDto.fromEntity(section));
    dto.createdBy = UserResponseDto.fromEntity(campaign.createdBy);
    dto.allowedUsers = (campaign.allowedUsers ?? []).map((user) =>
      UserResponseDto.fromEntity(user),
    );
    dto.createdAt = campaign.createdAt;
    dto.updatedAt = campaign.updatedAt;
    return dto;
  }
}
