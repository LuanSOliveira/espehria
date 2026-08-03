import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkSheetBiographyDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID da biografia a ser vinculada à ficha',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  biographyId: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'ID do registro real de melhoria de atributo da biografia selecionada pelo usuário',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  selectedImprovementId: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'ID da propriedade de atributo escolhida para a melhoria de atributo livre. Tipo ("Atributo") e valor (2) são fixos no backend',
    example: '990e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  freeImprovementPropertyId: string;
}
