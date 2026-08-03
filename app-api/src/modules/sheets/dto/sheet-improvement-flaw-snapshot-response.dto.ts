import { ApiProperty } from '@nestjs/swagger';
import { SheetImprovementFlawSnapshotEntryResponseDto } from './sheet-improvement-flaw-snapshot-entry-response.dto';
import { SheetImprovementFlawSnapshot } from '../interfaces/sheet-improvement-flaw-snapshot.interface';

export class SheetImprovementFlawSnapshotResponseDto {
  @ApiProperty({
    type: () => [SheetImprovementFlawSnapshotEntryResponseDto],
    description: 'Itens provenientes da raça vinculada à ficha',
  })
  race: SheetImprovementFlawSnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetImprovementFlawSnapshotEntryResponseDto],
    description: 'Itens provenientes da biografia vinculada à ficha',
  })
  biography: SheetImprovementFlawSnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetImprovementFlawSnapshotEntryResponseDto],
    description:
      'Itens provenientes de treinamentos (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  trainings: SheetImprovementFlawSnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetImprovementFlawSnapshotEntryResponseDto],
    description:
      'Itens provenientes de talentos (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  talents: SheetImprovementFlawSnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetImprovementFlawSnapshotEntryResponseDto],
    description:
      'Itens provenientes de características (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  characteristics: SheetImprovementFlawSnapshotEntryResponseDto[];

  static fromEntity(
    snapshot: SheetImprovementFlawSnapshot,
  ): SheetImprovementFlawSnapshotResponseDto {
    const dto = new SheetImprovementFlawSnapshotResponseDto();
    dto.race = snapshot.race.map((entry) =>
      SheetImprovementFlawSnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.biography = snapshot.biography.map((entry) =>
      SheetImprovementFlawSnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.trainings = snapshot.trainings.map((entry) =>
      SheetImprovementFlawSnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.talents = snapshot.talents.map((entry) =>
      SheetImprovementFlawSnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.characteristics = snapshot.characteristics.map((entry) =>
      SheetImprovementFlawSnapshotEntryResponseDto.fromRaw(entry),
    );
    return dto;
  }
}
