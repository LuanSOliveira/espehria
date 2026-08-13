import { ApiProperty } from '@nestjs/swagger';
import { DamageType } from '../entities/damage-type.entity';

export class DamageTypeResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do tipo de dano',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do tipo de dano',
    example: 'Cortante',
  })
  name: string;

  static fromEntity(damageType: DamageType): DamageTypeResponseDto {
    const dto = new DamageTypeResponseDto();
    dto.id = damageType.id;
    dto.name = damageType.name;
    return dto;
  }
}
