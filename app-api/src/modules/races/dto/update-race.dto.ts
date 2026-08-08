import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { CreateRaceDto } from './create-race.dto';

export class UpdateRaceDto extends PartialType(
  OmitType(CreateRaceDto, ['hitPoints'] as const),
) {
  @ApiProperty({
    example: 5,
    description: 'Pontos de Vida da raça (inteiro, mínimo 1, obrigatório)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Os Pontos de Vida devem ser um número inteiro.' })
  @Min(1, { message: 'Os Pontos de Vida devem ser maior ou igual a 1.' })
  hitPoints: number;
}
