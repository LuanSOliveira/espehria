import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Training } from '../entities/training.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class TrainingResponseDto {
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

  @ApiPropertyOptional({
    description: 'Descrição do treinamento em HTML',
    example: '<p>Treinamento focado em técnicas de combate corpo a corpo</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao treinamento',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(training: Training): TrainingResponseDto {
    const dto = new TrainingResponseDto();
    dto.id = training.id;
    dto.name = training.name;
    dto.description = training.description;
    dto.tags = (training.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = training.createdAt;
    dto.updatedAt = training.updatedAt;
    return dto;
  }
}
