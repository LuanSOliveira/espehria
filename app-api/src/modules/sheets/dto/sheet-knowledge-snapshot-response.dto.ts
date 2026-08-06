import { ApiProperty } from '@nestjs/swagger';
import { SheetKnowledgeSnapshotEntryResponseDto } from './sheet-knowledge-snapshot-entry-response.dto';
import { SheetKnowledgeSnapshot } from '../interfaces/sheet-knowledge-snapshot.interface';

export class SheetKnowledgeSnapshotResponseDto {
  @ApiProperty({
    type: () => [SheetKnowledgeSnapshotEntryResponseDto],
    description: 'Saberes provenientes da raça vinculada à ficha',
  })
  race: SheetKnowledgeSnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetKnowledgeSnapshotEntryResponseDto],
    description: 'Saberes provenientes da biografia vinculada à ficha',
  })
  biography: SheetKnowledgeSnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetKnowledgeSnapshotEntryResponseDto],
    description:
      'Saberes provenientes de treinamentos (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  trainings: SheetKnowledgeSnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetKnowledgeSnapshotEntryResponseDto],
    description:
      'Saberes provenientes de talentos (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  talents: SheetKnowledgeSnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetKnowledgeSnapshotEntryResponseDto],
    description:
      'Saberes provenientes de características (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  characteristics: SheetKnowledgeSnapshotEntryResponseDto[];

  static fromEntity(
    snapshot: SheetKnowledgeSnapshot,
  ): SheetKnowledgeSnapshotResponseDto {
    const dto = new SheetKnowledgeSnapshotResponseDto();
    dto.race = snapshot.race.map((entry) =>
      SheetKnowledgeSnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.biography = snapshot.biography.map((entry) =>
      SheetKnowledgeSnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.trainings = snapshot.trainings.map((entry) =>
      SheetKnowledgeSnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.talents = snapshot.talents.map((entry) =>
      SheetKnowledgeSnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.characteristics = snapshot.characteristics.map((entry) =>
      SheetKnowledgeSnapshotEntryResponseDto.fromRaw(entry),
    );
    return dto;
  }
}
