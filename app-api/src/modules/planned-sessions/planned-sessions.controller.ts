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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GoogleAccess } from '../auth/decorators/google-access.decorator';
import { GoogleAccessGuard } from '../auth/guards/google-access.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreatePlannedSessionDto } from './dto/create-planned-session.dto';
import { FindPlannedSessionsQueryDto } from './dto/find-planned-sessions-query.dto';
import { PaginatedPlannedSessionsResponseDto } from './dto/paginated-planned-sessions-response.dto';
import { PlannedSessionListItemResponseDto } from './dto/planned-session-list-item-response.dto';
import { PlannedSessionResponseDto } from './dto/planned-session-response.dto';
import { UpdatePlannedSessionDto } from './dto/update-planned-session.dto';
import { PlannedSessionsService } from './planned-sessions.service';

@ApiTags('planned-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('blocked')
@Controller('campaigns/:campaignId/planned-sessions')
export class PlannedSessionsController {
  constructor(
    private readonly plannedSessionsService: PlannedSessionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma sessão planejada dentro de uma campanha' })
  @ApiCreatedResponse({ type: PlannedSessionResponseDto })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description: 'Campanha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({
    description: 'IDs em formato inválido ou dados obrigatórios ausentes',
  })
  async create(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Body() dto: CreatePlannedSessionDto,
    @CurrentUser() currentUser: User,
  ): Promise<PlannedSessionResponseDto> {
    const plannedSession = await this.plannedSessionsService.create(
      campaignId,
      dto,
      currentUser,
    );
    return PlannedSessionResponseDto.fromEntity(plannedSession);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista sessões planejadas de uma campanha com paginação e filtro, restritas ao usuário autenticado',
  })
  @ApiOkResponse({ type: PaginatedPlannedSessionsResponseDto })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description: 'Campanha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({
    description:
      'ID de campanha em formato inválido ou parâmetros de paginação/filtro inválidos',
  })
  async findAll(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Query() query: FindPlannedSessionsQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<PaginatedPlannedSessionsResponseDto> {
    const { data, total, page, perPage } =
      await this.plannedSessionsService.findAllPaginated(
        campaignId,
        query,
        currentUser,
      );

    return {
      data: data.map((plannedSession) =>
        PlannedSessionListItemResponseDto.fromEntity(plannedSession),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca uma sessão planejada pelo id dentro de uma campanha',
  })
  @ApiOkResponse({ type: PlannedSessionResponseDto })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description:
      'Campanha não encontrada ou não pertence ao usuário (neste caso, a mensagem é "Campanha não encontrada."), ou sessão planejada não encontrada dentro da campanha (neste caso, a mensagem é "Sessão planejada não encontrada.")',
  })
  @ApiBadRequestResponse({
    description: 'IDs em formato inválido',
  })
  async findOne(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<PlannedSessionResponseDto> {
    const plannedSession = await this.plannedSessionsService.findOneOwned(
      campaignId,
      id,
      currentUser,
    );
    return PlannedSessionResponseDto.fromEntity(plannedSession);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma sessão planejada' })
  @ApiOkResponse({ type: PlannedSessionResponseDto })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description:
      'Campanha não encontrada ou não pertence ao usuário (neste caso, a mensagem é "Campanha não encontrada."), ou sessão planejada não encontrada dentro da campanha (neste caso, a mensagem é "Sessão planejada não encontrada.")',
  })
  @ApiBadRequestResponse({
    description: 'IDs em formato inválido ou dados inválidos',
  })
  async update(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlannedSessionDto,
    @CurrentUser() currentUser: User,
  ): Promise<PlannedSessionResponseDto> {
    const plannedSession = await this.plannedSessionsService.update(
      campaignId,
      id,
      dto,
      currentUser,
    );
    return PlannedSessionResponseDto.fromEntity(plannedSession);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma sessão planejada' })
  @ApiNoContentResponse({ description: 'Sessão planejada removida com sucesso' })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description:
      'Campanha não encontrada ou não pertence ao usuário (neste caso, a mensagem é "Campanha não encontrada."), ou sessão planejada não encontrada dentro da campanha (neste caso, a mensagem é "Sessão planejada não encontrada.")',
  })
  @ApiBadRequestResponse({
    description: 'IDs em formato inválido',
  })
  async remove(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.plannedSessionsService.remove(campaignId, id, currentUser);
  }
}
