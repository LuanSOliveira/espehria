import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateSheetKnowledgeNoteDto {
  @ApiProperty({
    description:
      'Nota livre associada ao saber (máx. 2000 caracteres; string vazia permitida para limpar a nota)',
    example: 'Aprendido com o mestre ferreiro da aldeia',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  note!: string;
}
