import { ApiProperty } from '@nestjs/swagger';
import { TraitType } from '../entities/trait-type.entity';

export class TraitTypeResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do tipo de traço',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do tipo de traço',
    example: 'Arma',
  })
  name: string;

  static fromEntity(traitType: TraitType): TraitTypeResponseDto {
    const dto = new TraitTypeResponseDto();
    dto.id = traitType.id;
    dto.name = traitType.name;
    return dto;
  }
}
