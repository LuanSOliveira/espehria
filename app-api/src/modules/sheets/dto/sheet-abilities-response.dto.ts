import { ApiProperty } from '@nestjs/swagger';
import { SheetCharacteristicsAbilitiesResponseDto } from './sheet-characteristics-abilities-response.dto';
import { SheetTrainingsAbilitiesResponseDto } from './sheet-trainings-abilities-response.dto';
import { SheetTalentsAbilitiesResponseDto } from './sheet-talents-abilities-response.dto';

export class SheetAbilitiesResponseDto {
  @ApiProperty({
    type: () => SheetCharacteristicsAbilitiesResponseDto,
    description: 'Características herdadas e extras da ficha',
  })
  characteristics: SheetCharacteristicsAbilitiesResponseDto;

  @ApiProperty({
    type: () => SheetTrainingsAbilitiesResponseDto,
    description:
      'Treinamentos da ficha: slots (quantidade determinada pelo nível), herdados e extras',
  })
  trainings: SheetTrainingsAbilitiesResponseDto;

  @ApiProperty({
    type: () => SheetTalentsAbilitiesResponseDto,
    description: 'Talentos herdados e extras da ficha',
  })
  talents: SheetTalentsAbilitiesResponseDto;

  static fromRaw(raw: {
    characteristics: SheetCharacteristicsAbilitiesResponseDto;
    trainings: SheetTrainingsAbilitiesResponseDto;
    talents: SheetTalentsAbilitiesResponseDto;
  }): SheetAbilitiesResponseDto {
    const dto = new SheetAbilitiesResponseDto();
    dto.characteristics = raw.characteristics;
    dto.trainings = raw.trainings;
    dto.talents = raw.talents;
    return dto;
  }
}
