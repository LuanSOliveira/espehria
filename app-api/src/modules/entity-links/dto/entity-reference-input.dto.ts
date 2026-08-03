import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { ReferenceableEntityType } from '../enums/referenceable-entity-type.enum';

export class EntityReferenceInputDto {
  @ApiProperty({
    enum: ReferenceableEntityType,
    enumName: 'ReferenceableEntityType',
    description:
      'Tipo de entidade referenciada (treinamento, talento, técnica, magia, característica ou biografia)',
    example: ReferenceableEntityType.TRAINING,
  })
  @IsEnum(ReferenceableEntityType)
  entityType!: ReferenceableEntityType;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único (UUID) da entidade referenciada',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  id!: string;
}
