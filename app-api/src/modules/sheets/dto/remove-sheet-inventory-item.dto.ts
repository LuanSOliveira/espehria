import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class RemoveSheetInventoryItemDto {
  @ApiProperty({
    minimum: 1,
    example: 1,
    description:
      'Quantidade a remover do item (inteiro >= 1, não pode exceder a quantidade atual do item)',
  })
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade deve ser maior ou igual a 1.' })
  quantity: number;
}
