import { ApiProperty } from '@nestjs/swagger';
import { SheetProficiencySnapshotEntry } from '../interfaces/sheet-proficiency-snapshot.interface';

export class SheetProficiencySnapshotEntryResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador do registro real de proficiência',
  })
  id: string;

  @ApiProperty({
    description: 'Propriedade da proficiência',
  })
  property: { id: string; name: string };

  @ApiProperty({
    description: 'Graduação da proficiência',
  })
  gradation: { id: string; name: string; level: number };

  @ApiProperty({
    description: 'Nome da entidade que concedeu esta proficiência',
    example: 'Elfo',
  })
  sourceName: string;

  static fromRaw(
    entry: SheetProficiencySnapshotEntry,
  ): SheetProficiencySnapshotEntryResponseDto {
    const dto = new SheetProficiencySnapshotEntryResponseDto();
    dto.id = entry.id;
    dto.property = { id: entry.property.id, name: entry.property.name };
    dto.gradation = {
      id: entry.gradation.id,
      name: entry.gradation.name,
      level: entry.gradation.level,
    };
    dto.sourceName = entry.sourceName;
    return dto;
  }
}
