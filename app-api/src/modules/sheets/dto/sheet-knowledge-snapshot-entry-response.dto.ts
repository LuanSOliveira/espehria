import { ApiProperty } from '@nestjs/swagger';
import { SheetKnowledgeSnapshotEntry } from '../interfaces/sheet-knowledge-snapshot.interface';

export class SheetKnowledgeSnapshotEntryResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador do registro real de saber',
  })
  id: string;

  @ApiProperty({
    description: 'Título livre do saber',
    example: 'Astronomia Élfica',
  })
  title: string;

  @ApiProperty({
    description: 'Graduação do saber',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Perito',
      level: 3,
    },
  })
  gradation: { id: string; name: string; level: number };

  @ApiProperty({
    description: 'Nome da entidade que concedeu este saber',
    example: 'Elfo',
  })
  sourceName: string;

  static fromRaw(
    entry: SheetKnowledgeSnapshotEntry,
  ): SheetKnowledgeSnapshotEntryResponseDto {
    const dto = new SheetKnowledgeSnapshotEntryResponseDto();
    dto.id = entry.id;
    dto.title = entry.title;
    dto.gradation = {
      id: entry.gradation.id,
      name: entry.gradation.name,
      level: entry.gradation.level,
    };
    dto.sourceName = entry.sourceName;
    return dto;
  }
}
