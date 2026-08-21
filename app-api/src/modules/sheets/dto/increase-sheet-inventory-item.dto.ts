import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class IncreaseSheetInventoryItemDto {
  @ApiProperty({
    minimum: 1,
    example: 1,
    description:
      'Quantidade a adicionar ao item já existente (inteiro >= 1), respeitando o Volume Limite da ficha',
  })
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade deve ser maior ou igual a 1.' })
  quantity: number;
}
