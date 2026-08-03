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
  ApiConflictResponse,
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
import { CampaignsService } from './campaigns.service';
import { CampaignListItemResponseDto } from './dto/campaign-list-item-response.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';
import { CampaignSheetResponseDto } from './dto/campaign-sheet-response.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { FindCampaignsQueryDto } from './dto/find-campaigns-query.dto';
import { PaginatedCampaignsResponseDto } from './dto/paginated-campaigns-response.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('blocked')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma campanha' })
  @ApiCreatedResponse({ type: CampaignResponseDto })
  @ApiConflictResponse({
    description: 'Já existe uma campanha com este nome',
  })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, dados obrigatórios ausentes, ou um ou mais usuários em allowedUserIds não são válidos (devem ser usuários Google)',
  })
  async create(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() currentUser: User,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.create(dto, currentUser);
    return CampaignResponseDto.fromEntity(campaign);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista campanhas com paginação e filtro, restritas ao usuário autenticado',
  })
  @ApiOkResponse({ type: PaginatedCampaignsResponseDto })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindCampaignsQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<PaginatedCampaignsResponseDto> {
    const { data, total, page, perPage } =
      await this.campaignsService.findAllPaginated(query, currentUser);

    return {
      data: data.map((campaign) =>
        CampaignListItemResponseDto.fromEntity(campaign),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca uma campanha pelo id, restrita ao usuário autenticado',
  })
  @ApiOkResponse({ type: CampaignResponseDto })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description: 'Campanha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({ description: 'ID de campanha em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.findOwnedById(
      id,
      currentUser.id,
    );
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }
    return CampaignResponseDto.fromEntity(campaign);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma campanha' })
  @ApiOkResponse({ type: CampaignResponseDto })
  @ApiConflictResponse({
    description: 'Já existe uma campanha com este nome',
  })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description: 'Campanha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ID em formato inválido, ou um ou mais usuários em allowedUserIds não são válidos (devem ser usuários Google)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() currentUser: User,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.update(id, dto, currentUser);
    return CampaignResponseDto.fromEntity(campaign);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma campanha' })
  @ApiNoContentResponse({ description: 'Campanha removida com sucesso' })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description: 'Campanha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({ description: 'ID de campanha em formato inválido' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.campaignsService.remove(id, currentUser);
  }

  @Delete(':id/allowed-users/:userId')
  @ApiOperation({
    summary: 'Remove um usuário da lista de usuários permitidos da campanha',
  })
  @ApiOkResponse({ type: CampaignResponseDto })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description:
      'Campanha não encontrada, não pertence ao usuário, ou usuário não está na lista de usuários permitidos',
  })
  @ApiBadRequestResponse({
    description: 'IDs em formato inválido',
  })
  async removeAllowedUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.removeAllowedUser(
      id,
      userId,
      currentUser,
    );
    return CampaignResponseDto.fromEntity(campaign);
  }

  @Get(':id/sheets')
  @ApiOperation({
    summary: 'Lista todas as fichas vinculadas a uma campanha',
  })
  @ApiOkResponse({ type: [CampaignSheetResponseDto] })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description: 'Campanha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({
    description: 'ID de campanha em formato inválido',
  })
  async findSheets(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<CampaignSheetResponseDto[]> {
    const sheets = await this.campaignsService.findSheetsOfCampaign(
      id,
      currentUser,
    );
    return sheets.map((sheet) => CampaignSheetResponseDto.fromEntity(sheet));
  }

  @Delete(':id/sheets/:sheetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desvincula uma ficha de uma campanha',
  })
  @ApiNoContentResponse({
    description: 'Ficha desvinculada com sucesso',
  })
  @ApiForbiddenResponse({
    description: 'Usuários Google não têm acesso a campanhas',
  })
  @ApiNotFoundResponse({
    description:
      'Campanha não encontrada, não pertence ao usuário, ou ficha não está vinculada a esta campanha',
  })
  @ApiBadRequestResponse({
    description: 'IDs em formato inválido',
  })
  async unassignSheet(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sheetId', ParseUUIDPipe) sheetId: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.campaignsService.unassignSheet(id, sheetId, currentUser);
  }
}
