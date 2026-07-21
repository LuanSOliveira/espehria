import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '../entities/tag.entity';

export class TagResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador único da tag' })
  id: string;

  @ApiProperty({ description: 'Nome da tag' })
  name: string;

  @ApiProperty({ description: 'Cor da tag em formato hexadecimal' })
  color: string;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  static fromEntity(tag: Tag): TagResponseDto {
    const dto = new TagResponseDto();
    dto.id = tag.id;
    dto.name = tag.name;
    dto.color = tag.color;
    dto.createdAt = tag.createdAt;
    return dto;
  }
}
