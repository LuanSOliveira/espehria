import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignSection } from '../entities/campaign-section.entity';

export class CampaignSectionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da seção',
  })
  id: string;

  @ApiProperty({ description: 'Título da seção' })
  label: string;

  @ApiPropertyOptional({ description: 'Descrição da seção (HTML)' })
  description: string | null;

  @ApiProperty({ description: 'Posição da seção na sequência de adição' })
  order: number;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(section: CampaignSection): CampaignSectionResponseDto {
    const dto = new CampaignSectionResponseDto();
    dto.id = section.id;
    dto.label = section.label;
    dto.description = section.description;
    dto.order = section.order;
    dto.createdAt = section.createdAt;
    dto.updatedAt = section.updatedAt;
    return dto;
  }
}
