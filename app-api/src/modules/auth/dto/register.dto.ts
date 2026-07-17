import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Nome Completo' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ minLength: 8, example: 'senha-forte-123' })
  @IsString()
  @MinLength(8)
  password: string;
}
