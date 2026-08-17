import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enhancement } from '../entities/enhancement.entity';
import { EnhancementType } from '../enums/enhancement-type.enum';

export class EnhancementResponseDto {
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

  @ApiPropertyOptional({
    description: 'Efeito do aprimoramento em HTML',
    example: '<p>Aumenta a resistência do item</p>',
  })
  effect: string | null;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(enhancement: Enhancement): EnhancementResponseDto {
    const dto = new EnhancementResponseDto();
    dto.id = enhancement.id;
    dto.name = enhancement.name;
    dto.type = enhancement.type;
    dto.effect = enhancement.effect;
    dto.createdAt = enhancement.createdAt;
    dto.updatedAt = enhancement.updatedAt;
    return dto;
  }
}
