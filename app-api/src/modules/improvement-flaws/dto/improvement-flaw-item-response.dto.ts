import { ApiProperty } from '@nestjs/swagger';
import { ImprovementFlaw } from '../entities/improvement-flaw.entity';
import { ImprovementFlawTypeResponseDto } from '../../improvement-flaw-types/dto/improvement-flaw-type-response.dto';
import { ImprovementFlawPropertyResponseDto } from '../../improvement-flaw-properties/dto/improvement-flaw-property-response.dto';

export class ImprovementFlawItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'b3f1c2a4-5d6e-4f7a-8b9c-0d1e2f3a4b5c',
    description: 'Identificador do registro de melhoria/defeito',
  })
  id: string;

  @ApiProperty({
    example: 3,
    description: 'Valor do item de melhoria/defeito',
  })
  value: number;

  @ApiProperty({ type: () => ImprovementFlawTypeResponseDto })
  type: ImprovementFlawTypeResponseDto;

  @ApiProperty({ type: () => ImprovementFlawPropertyResponseDto })
  property: ImprovementFlawPropertyResponseDto;

  static fromResolved(item: ImprovementFlaw): ImprovementFlawItemResponseDto {
    const dto = new ImprovementFlawItemResponseDto();
    dto.id = item.id;
    dto.value = item.value;
    dto.type = ImprovementFlawTypeResponseDto.fromEntity(item.type);
    dto.property = ImprovementFlawPropertyResponseDto.fromEntity(item.property);
    return dto;
  }
}
