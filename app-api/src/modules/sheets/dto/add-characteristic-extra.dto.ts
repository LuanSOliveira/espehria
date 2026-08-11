import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddCharacteristicExtraDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID da característica a ser adicionada como extra da ficha',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  characteristicId: string;
}
