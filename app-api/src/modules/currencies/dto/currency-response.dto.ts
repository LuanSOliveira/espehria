import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../entities/currency.entity';

export class CurrencyResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da moeda',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Abreviação da moeda',
    example: 'PO',
  })
  abbreviation: string;

  @ApiProperty({
    description: 'Nome da moeda',
    example: 'Ouro',
  })
  name: string;

  static fromEntity(currency: Currency): CurrencyResponseDto {
    const dto = new CurrencyResponseDto();
    dto.id = currency.id;
    dto.abbreviation = currency.abbreviation;
    dto.name = currency.name;
    return dto;
  }
}
