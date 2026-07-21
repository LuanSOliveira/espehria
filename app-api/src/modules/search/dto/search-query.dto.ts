import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Texto a ser buscado no nome das entidades linkáveis',
    example: 'Dragão',
  })
  @IsString()
  @IsNotEmpty()
  query!: string;
}
