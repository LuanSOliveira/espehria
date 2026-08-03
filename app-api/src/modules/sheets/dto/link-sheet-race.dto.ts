import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkSheetRaceDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID da raça a ser vinculada à ficha',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  raceId: string;
}
