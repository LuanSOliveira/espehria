import { ApiProperty } from '@nestjs/swagger';
import { ImprovementFlaw } from '../entities/improvement-flaw.entity';
import { ImprovementFlawTypeResponseDto } from '../../improvement-flaw-types/dto/improvement-flaw-type-response.dto';
import { ImprovementFlawPropertyResponseDto } from '../../improvement-flaw-properties/dto/improvement-flaw-property-response.dto';

export class ImprovementFlawItemResponseDto {
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
    dto.value = item.value;
    dto.type = ImprovementFlawTypeResponseDto.fromEntity(item.type);
    dto.property = ImprovementFlawPropertyResponseDto.fromEntity(item.property);
    return dto;
  }
}
