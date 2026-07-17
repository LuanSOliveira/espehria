import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { AuthProvider } from '../../users/enums/auth-provider.enum';

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AuthProvider })
  provider: AuthProvider;

  static fromEntity(user: User): AuthUserDto {
    const dto = new AuthUserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.provider = user.provider;
    return dto;
  }
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
