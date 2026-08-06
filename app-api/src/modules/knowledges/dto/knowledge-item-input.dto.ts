import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class KnowledgeItemInputDto {
  @ApiProperty({
    description: 'Título livre do saber',
    example: 'Astronomia Élfica',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador da graduação de saber',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  gradation!: string;
}
