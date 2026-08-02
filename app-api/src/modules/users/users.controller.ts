import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GoogleAccess } from '../auth/decorators/google-access.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoogleAccessGuard } from '../auth/guards/google-access.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { FindGoogleUsersQueryDto } from './dto/find-google-users-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('blocked')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um usuário com e-mail e senha' })
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.createLocalUserWithPassword(dto);
    return UserResponseDto.fromEntity(user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista usuários com paginação e filtro por e-mail' })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async findAll(
    @Query() query: FindUsersQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    const { data, total, page, perPage } =
      await this.usersService.findAllLocalPaginated(query);

    return {
      data: data.map((user) => UserResponseDto.fromEntity(user)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get('google')
  @ApiOperation({
    summary:
      'Lista usuários Google (provider = GOOGLE) com paginação e busca por nome ou e-mail',
  })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async findGoogleUsers(
    @Query() query: FindGoogleUsersQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    const { data, total, page, perPage } =
      await this.usersService.findAllGooglePaginated(query);

    return {
      data: data.map((user) => UserResponseDto.fromEntity(user)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um usuário pelo id' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findLocalUserById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return UserResponseDto.fromEntity(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um usuário' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateLocalUser(id, dto);
    return UserResponseDto.fromEntity(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um usuário' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.deleteLocalUser(id);
  }
}
