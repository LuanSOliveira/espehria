import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ResolveProficiencyAdjustmentDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID da propriedade de proficiência escolhida como substituta',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  propertyId: string;
}
