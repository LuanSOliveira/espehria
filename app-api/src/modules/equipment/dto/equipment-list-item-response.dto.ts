import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equipment } from '../entities/equipment.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class EquipmentListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do equipamento',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do equipamento',
    example: 'https://exemplo.com/espada-longa.jpg',
  })
  referenceImage: string | null;

  @ApiProperty({
    description: 'Nome do equipamento',
    example: 'Espada Longa',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao equipamento',
  })
  tags: TagResponseDto[];

  static fromEntity(equipment: Equipment): EquipmentListItemResponseDto {
    const dto = new EquipmentListItemResponseDto();
    dto.id = equipment.id;
    dto.referenceImage = equipment.referenceImage;
    dto.name = equipment.name;
    dto.tags = (equipment.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
