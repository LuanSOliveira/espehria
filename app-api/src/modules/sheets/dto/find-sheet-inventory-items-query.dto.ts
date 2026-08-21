import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SheetInventoryItemCategory } from '../enums/sheet-inventory-item-category.enum';

export class FindSheetInventoryItemsQueryDto {
  @ApiPropertyOptional({
    enum: SheetInventoryItemCategory,
    description: 'Filtra os itens retornados por uma categoria específica',
    example: SheetInventoryItemCategory.WEAPON,
  })
  @IsOptional()
  @IsEnum(SheetInventoryItemCategory)
  category?: SheetInventoryItemCategory;

  @ApiPropertyOptional({
    description:
      'Quando true, retorna somente itens com equipped = true (para a aba "Equipados")',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): boolean | undefined =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  equippedOnly?: boolean;
}
