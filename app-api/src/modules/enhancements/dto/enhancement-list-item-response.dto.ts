import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enhancement } from '../entities/enhancement.entity';
import { EnhancementType } from '../enums/enhancement-type.enum';

export class EnhancementListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do aprimoramento',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do aprimoramento',
    example: 'Reforçado',
  })
  name: string;

  @ApiPropertyOptional({
    enum: EnhancementType,
    description: 'Tipo do aprimoramento',
  })
  type: EnhancementType | null;

  static fromEntity(enhancement: Enhancement): EnhancementListItemResponseDto {
    const dto = new EnhancementListItemResponseDto();
    dto.id = enhancement.id;
    dto.name = enhancement.name;
    dto.type = enhancement.type;
    return dto;
  }
}
