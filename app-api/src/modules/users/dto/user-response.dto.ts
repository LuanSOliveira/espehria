import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { AuthProvider } from '../enums/auth-provider.enum';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AuthProvider })
  provider: AuthProvider;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.provider = user.provider;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
