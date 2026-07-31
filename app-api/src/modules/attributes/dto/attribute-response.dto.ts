import { ApiProperty } from '@nestjs/swagger';
import { Attribute } from '../entities/attribute.entity';

export class AttributeResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do atributo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do atributo',
    example: 'Força',
  })
  name: string;

  static fromEntity(attribute: Attribute): AttributeResponseDto {
    const dto = new AttributeResponseDto();
    dto.id = attribute.id;
    dto.name = attribute.name;
    return dto;
  }
}
