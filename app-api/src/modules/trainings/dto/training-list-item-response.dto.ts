import { ApiProperty } from '@nestjs/swagger';
import { Training } from '../entities/training.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class TrainingListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do treinamento',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do treinamento',
    example: 'Treinamento de Combate Corpo a Corpo',
  })
  name: string;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao treinamento',
  })
  tags: TagResponseDto[];

  static fromEntity(training: Training): TrainingListItemResponseDto {
    const dto = new TrainingListItemResponseDto();
    dto.id = training.id;
    dto.name = training.name;
    dto.tags = (training.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    return dto;
  }
}
