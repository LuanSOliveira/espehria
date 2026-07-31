import { ApiProperty } from '@nestjs/swagger';
import { Characteristic } from '../entities/characteristic.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class CharacteristicListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da característica',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da característica',
    example: 'Força',
  })
  name: string;

  @ApiProperty({ description: 'Nível da característica', example: 3 })
  level: number;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à característica',
  })
  tags: TagResponseDto[];

  static fromEntity(
    characteristic: Characteristic,
  ): CharacteristicListItemResponseDto {
    const dto = new CharacteristicListItemResponseDto();
    dto.id = characteristic.id;
    dto.name = characteristic.name;
    dto.level = characteristic.level;
    dto.tags = (characteristic.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
