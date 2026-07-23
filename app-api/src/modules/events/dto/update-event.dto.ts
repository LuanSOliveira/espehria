import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(
  OmitType(CreateEventDto, ['eraId'] as const),
) {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'ID da era vinculada ao evento. Omitir o campo mantém a era atual inalterada; enviar um novo id troca a era; enviar "null" explicitamente remove a vinculação.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  eraId?: string | null;
}
