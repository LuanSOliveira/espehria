import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  SheetProficiencyAdjustment,
  SheetProficiencyAdjustmentSourceType,
} from '../interfaces/sheet-proficiency-adjustment.interface';

export class SheetProficiencyAdjustmentResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador do ajuste (gerado a cada recálculo)',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo da entidade de origem que trouxe a proficiência',
    example: 'race',
  })
  sourceType: SheetProficiencyAdjustmentSourceType;

  @ApiProperty({
    description: 'Nome da entidade de origem que trouxe a proficiência',
    example: 'Elfo',
  })
  sourceName: string;

  @ApiProperty({
    description: 'Propriedade original da proficiência inválida',
  })
  originalProperty: { id: string; name: string };

  @ApiProperty({
    description: 'Graduação original da proficiência inválida (fixa)',
  })
  originalGradation: { id: string; name: string; level: number };

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Propriedade substituta escolhida pelo usuário (nula enquanto pendente)',
  })
  adjustedProperty: { id: string; name: string } | null;

  static fromRaw(
    adjustment: SheetProficiencyAdjustment,
  ): SheetProficiencyAdjustmentResponseDto {
    const dto = new SheetProficiencyAdjustmentResponseDto();
    dto.id = adjustment.id;
    dto.sourceType = adjustment.sourceType;
    dto.sourceName = adjustment.sourceName;
    dto.originalProperty = {
      id: adjustment.originalProperty.id,
      name: adjustment.originalProperty.name,
    };
    dto.originalGradation = {
      id: adjustment.originalGradation.id,
      name: adjustment.originalGradation.name,
      level: adjustment.originalGradation.level,
    };
    dto.adjustedProperty = adjustment.adjustedProperty
      ? {
          id: adjustment.adjustedProperty.id,
          name: adjustment.adjustedProperty.name,
        }
      : null;
    return dto;
  }
}
