import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CharacterKinshipInputDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID do personagem referenciado como parente',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  relativeId: string;

  @ApiProperty({
    description: 'Grau ou tipo de parentesco (texto livre)',
    example: 'Pai',
  })
  @IsString()
  @IsNotEmpty()
  kinship: string;
}
