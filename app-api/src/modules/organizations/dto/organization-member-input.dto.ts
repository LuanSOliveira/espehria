import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class OrganizationMemberInputDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID do personagem membro da organização',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  characterId: string;

  @ApiProperty({
    description: 'Função exercida na organização (texto livre)',
    example: 'Líder',
  })
  @IsString()
  @IsNotEmpty()
  role: string;
}
