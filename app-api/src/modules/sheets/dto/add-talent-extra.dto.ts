import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddTalentExtraDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID do talento a ser adicionado como extra da ficha',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  talentId: string;
}
