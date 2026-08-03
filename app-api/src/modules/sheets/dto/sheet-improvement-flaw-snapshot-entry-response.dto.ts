import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImprovementFlawTypeResponseDto } from '../../improvement-flaw-types/dto/improvement-flaw-type-response.dto';
import { ImprovementFlawPropertyResponseDto } from '../../improvement-flaw-properties/dto/improvement-flaw-property-response.dto';
import { SheetImprovementFlawSnapshotEntry } from '../interfaces/sheet-improvement-flaw-snapshot.interface';

export class SheetImprovementFlawSnapshotEntryResponseDto {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Identificador do registro real de melhoria/defeito, quando o item corresponde a um registro em improvement_flaws; nulo para a melhoria livre criada no modal de Biografia',
  })
  id: string | null;

  @ApiProperty({
    example: 2,
    description: 'Valor congelado do item de melhoria/defeito',
  })
  value: number;

  @ApiProperty({ type: () => ImprovementFlawTypeResponseDto })
  type: ImprovementFlawTypeResponseDto;

  @ApiProperty({ type: () => ImprovementFlawPropertyResponseDto })
  property: ImprovementFlawPropertyResponseDto;

  @ApiProperty({
    description: 'Nome da entidade que concedeu este item (raça ou biografia)',
    example: 'Elfo',
  })
  sourceName: string;

  static fromRaw(
    entry: SheetImprovementFlawSnapshotEntry,
  ): SheetImprovementFlawSnapshotEntryResponseDto {
    const dto = new SheetImprovementFlawSnapshotEntryResponseDto();
    dto.id = entry.id;
    dto.value = entry.value;
    dto.type = { id: entry.type.id, name: entry.type.name };
    dto.property = {
      id: entry.property.id,
      name: entry.property.name,
      typeIds: [],
    };
    dto.sourceName = entry.sourceName;
    return dto;
  }
}
