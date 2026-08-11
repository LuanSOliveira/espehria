import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FillTrainingSlotDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID do treinamento a ser vinculado a este slot',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  trainingId: string;
}
