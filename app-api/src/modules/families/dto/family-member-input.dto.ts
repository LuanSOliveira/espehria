import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';

export class FamilyMemberInputDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID do personagem membro da família',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  characterId: string;

  @ApiProperty({
    description:
      'Posição X do card do personagem no quadro da árvore genealógica',
    example: 120,
  })
  @IsNumber()
  positionX: number;

  @ApiProperty({
    description:
      'Posição Y do card do personagem no quadro da árvore genealógica',
    example: 80,
  })
  @IsNumber()
  positionY: number;
}
