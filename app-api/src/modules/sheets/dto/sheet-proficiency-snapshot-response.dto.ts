import { ApiProperty } from '@nestjs/swagger';
import { SheetProficiencySnapshotEntryResponseDto } from './sheet-proficiency-snapshot-entry-response.dto';
import { SheetProficiencySnapshot } from '../interfaces/sheet-proficiency-snapshot.interface';

export class SheetProficiencySnapshotResponseDto {
  @ApiProperty({
    type: () => [SheetProficiencySnapshotEntryResponseDto],
    description: 'Proficiências provenientes da raça vinculada à ficha',
  })
  race: SheetProficiencySnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetProficiencySnapshotEntryResponseDto],
    description: 'Proficiências provenientes da biografia vinculada à ficha',
  })
  biography: SheetProficiencySnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetProficiencySnapshotEntryResponseDto],
    description:
      'Proficiências provenientes de treinamentos (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  trainings: SheetProficiencySnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetProficiencySnapshotEntryResponseDto],
    description:
      'Proficiências provenientes de talentos (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  talents: SheetProficiencySnapshotEntryResponseDto[];

  @ApiProperty({
    type: () => [SheetProficiencySnapshotEntryResponseDto],
    description:
      'Proficiências provenientes de características (estrutura pronta para uso futuro, sempre vazia por ora)',
  })
  characteristics: SheetProficiencySnapshotEntryResponseDto[];

  static fromEntity(
    snapshot: SheetProficiencySnapshot,
  ): SheetProficiencySnapshotResponseDto {
    const dto = new SheetProficiencySnapshotResponseDto();
    dto.race = snapshot.race.map((entry) =>
      SheetProficiencySnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.biography = snapshot.biography.map((entry) =>
      SheetProficiencySnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.trainings = snapshot.trainings.map((entry) =>
      SheetProficiencySnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.talents = snapshot.talents.map((entry) =>
      SheetProficiencySnapshotEntryResponseDto.fromRaw(entry),
    );
    dto.characteristics = snapshot.characteristics.map((entry) =>
      SheetProficiencySnapshotEntryResponseDto.fromRaw(entry),
    );
    return dto;
  }
}
