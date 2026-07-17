import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description:
      'ID Token retornado pelo Google Identity Services no front-end.',
  })
  @IsString()
  idToken: string;
}
