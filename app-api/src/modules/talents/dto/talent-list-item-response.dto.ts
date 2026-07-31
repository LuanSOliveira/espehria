import { ApiProperty } from '@nestjs/swagger';
import { Talent } from '../entities/talent.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class TalentListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do talento',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do talento',
    example: 'Talento para Persuasão',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao talento',
  })
  tags: TagResponseDto[];

  static fromEntity(talent: Talent): TalentListItemResponseDto {
    const dto = new TalentListItemResponseDto();
    dto.id = talent.id;
    dto.name = talent.name;
    dto.tags = (talent.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
