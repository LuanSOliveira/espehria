import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com e-mail e senha' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(dto);
    return { accessToken, user: AuthUserDto.fromEntity(user) };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login (ou cadastro) com Google ID Token' })
  @ApiOkResponse({ type: AuthResponseDto })
  async google(@Body() dto: GoogleLoginDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.loginWithGoogle(
      dto.idToken,
    );
    return { accessToken, user: AuthUserDto.fromEntity(user) };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser() user: User): AuthUserDto {
    return AuthUserDto.fromEntity(user);
  }
}
