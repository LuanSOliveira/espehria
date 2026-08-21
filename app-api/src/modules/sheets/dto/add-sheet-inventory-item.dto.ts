import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsUUID,
  Min,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { SheetInventoryItemCategory } from '../enums/sheet-inventory-item-category.enum';

const CATALOG_ITEM_ID_OR_CUSTOM_DATA_MESSAGE =
  'Informe catalogItemId (item do catálogo) ou customData (item avulso), nunca os dois nem nenhum.';

@ValidatorConstraint({
  name: 'exactlyOneOfCatalogItemIdOrCustomData',
  async: false,
})
class ExactlyOneOfCatalogItemIdOrCustomDataConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as AddSheetInventoryItemDto;
    return Boolean(dto.catalogItemId) !== Boolean(dto.customData);
  }

  defaultMessage(): string {
    return CATALOG_ITEM_ID_OR_CUSTOM_DATA_MESSAGE;
  }
}

export class AddSheetInventoryItemDto {
  @ApiProperty({
    enum: SheetInventoryItemCategory,
    description: 'Categoria do item a adicionar ao inventário da ficha',
    example: SheetInventoryItemCategory.WEAPON,
  })
  @IsEnum(SheetInventoryItemCategory)
  // Aplicado aqui (e não em catalogItemId/customData) porque `@ValidateIf`
  // nesses dois campos zera TODAS as validações do campo (inclusive
  // @Validate) quando sua própria condição é falsa — `category` não tem
  // `@ValidateIf`, então a exclusividade mútua é sempre checada.
  @Validate(ExactlyOneOfCatalogItemIdOrCustomDataConstraint)
  category: SheetInventoryItemCategory;

  @ApiProperty({
    minimum: 1,
    example: 1,
    description: 'Quantidade do item a adicionar (inteiro >= 1)',
  })
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade deve ser maior ou igual a 1.' })
  quantity: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'ID do item já cadastrado no catálogo da categoria informada. Mutuamente exclusivo com customData — exatamente um dos dois deve ser informado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ValidateIf((dto: AddSheetInventoryItemDto) => !dto.customData)
  @IsUUID('4', {
    message: CATALOG_ITEM_ID_OR_CUSTOM_DATA_MESSAGE,
  })
  catalogItemId?: string;

  @ApiPropertyOptional({
    description:
      'Dados de um item avulso (não cadastrado no catálogo), com os campos esperados do formulário de cadastro da categoria informada. Mutuamente exclusivo com catalogItemId — exatamente um dos dois deve ser informado',
    example: { name: 'Poção Improvisada', volume: 0.5 },
  })
  @ValidateIf((dto: AddSheetInventoryItemDto) => !dto.catalogItemId)
  @IsObject({
    message: CATALOG_ITEM_ID_OR_CUSTOM_DATA_MESSAGE,
  })
  customData?: Record<string, unknown>;
}
