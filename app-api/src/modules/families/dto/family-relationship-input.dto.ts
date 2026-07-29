import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { FamilyRelationshipType } from '../enums/family-relationship-type.enum';

export class FamilyRelationshipInputDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID do personagem de origem do vínculo (para PARENT, o pai/mãe)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  sourceCharacterId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID do personagem de destino do vínculo (para PARENT, o filho/filha)',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  targetCharacterId: string;

  @ApiProperty({
    enum: FamilyRelationshipType,
    description: 'Tipo do vínculo de parentesco',
    example: FamilyRelationshipType.PARENT,
  })
  @IsEnum(FamilyRelationshipType)
  type: FamilyRelationshipType;
}
