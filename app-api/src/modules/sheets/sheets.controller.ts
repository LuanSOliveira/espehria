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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignsService } from '../campaigns/campaigns.service';
import { CampaignOptionResponseDto } from '../campaigns/dto/campaign-option-response.dto';
import { User } from '../users/entities/user.entity';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { FindSheetsQueryDto } from './dto/find-sheets-query.dto';
import { LinkSheetBiographyDto } from './dto/link-sheet-biography.dto';
import { LinkSheetRaceDto } from './dto/link-sheet-race.dto';
import { PaginatedSheetsResponseDto } from './dto/paginated-sheets-response.dto';
import { ResolveProficiencyAdjustmentDto } from './dto/resolve-proficiency-adjustment.dto';
import { SheetListItemResponseDto } from './dto/sheet-list-item-response.dto';
import { SheetResponseDto } from './dto/sheet-response.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { SheetsService } from './sheets.service';

@ApiTags('sheets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sheets')
export class SheetsController {
  constructor(
    private readonly sheetsService: SheetsService,
    private readonly campaignsService: CampaignsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova ficha para o usuário autenticado' })
  @ApiCreatedResponse({ type: SheetResponseDto })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ID de campanha em formato inválido, ou dados obrigatórios ausentes',
  })
  async create(
    @Body() dto: CreateSheetDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.create(dto, currentUser);
    return SheetResponseDto.fromEntity(sheet);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista fichas do usuário autenticado com paginação e filtro por nome/campanha',
  })
  @ApiOkResponse({ type: PaginatedSheetsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindSheetsQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<PaginatedSheetsResponseDto> {
    const { data, total, page, perPage } =
      await this.sheetsService.findAllPaginated(query, currentUser);

    return {
      data: data.map((sheet) => SheetListItemResponseDto.fromEntity(sheet)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get('campaign-options')
  @ApiOperation({
    summary:
      'Lista campanhas visíveis ao usuário autenticado (para filtro e autocomplete de fichas)',
  })
  @ApiOkResponse({ type: [CampaignOptionResponseDto] })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou não processáveis',
  })
  async findCampaignOptions(
    @CurrentUser() currentUser: User,
  ): Promise<CampaignOptionResponseDto[]> {
    const campaigns =
      await this.campaignsService.findVisibleForUser(currentUser);
    return campaigns.map((campaign) =>
      CampaignOptionResponseDto.fromEntity(campaign),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma ficha pelo id' })
  @ApiOkResponse({ type: SheetResponseDto })
  @ApiNotFoundResponse({
    description: 'Ficha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({ description: 'ID de ficha em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.findAccessibleById(id, currentUser);
    if (!sheet) {
      throw new NotFoundException(
        'Ficha não encontrada ou não pertence ao usuário.',
      );
    }
    return SheetResponseDto.fromEntity(sheet);
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'Atualiza campos de uma ficha (permite atualização parcial por campo)',
  })
  @ApiOkResponse({ type: SheetResponseDto })
  @ApiNotFoundResponse({
    description: 'Ficha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem inválida, nível fora do intervalo válido, IDs em formato inválido, ou parâmetros de validação inválidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSheetDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.update(id, dto, currentUser);
    return SheetResponseDto.fromEntity(sheet);
  }

  @Put(':id/race')
  @ApiOperation({
    summary:
      'Vincula ou troca a raça da ficha, substituindo completamente as entradas de melhorias, defeitos e proficiências da raça anterior',
  })
  @ApiOkResponse({ type: SheetResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou raça não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou de raça em formato inválido',
  })
  async linkRace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkSheetRaceDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.linkRace(id, dto, currentUser);
    return SheetResponseDto.fromEntity(sheet);
  }

  @Delete(':id/race')
  @ApiOperation({
    summary:
      'Desvincula a raça da ficha, limpando as entradas de melhorias, defeitos e proficiências da raça',
  })
  @ApiOkResponse({ type: SheetResponseDto })
  @ApiNotFoundResponse({
    description: 'Ficha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({ description: 'ID de ficha em formato inválido' })
  async unlinkRace(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.unlinkRace(id, currentUser);
    return SheetResponseDto.fromEntity(sheet);
  }

  @Put(':id/biography')
  @ApiOperation({
    summary:
      'Vincula ou troca a biografia da ficha, incluindo no snapshot melhorias de atributo, proficiências e demais melhorias da biografia',
  })
  @ApiOkResponse({ type: SheetResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha, biografia, melhoria selecionada ou propriedade não encontrados',
  })
  @ApiConflictResponse({
    description:
      'Melhoria selecionada não pertence à biografia informada ou não é do tipo Atributo, ou propriedade da melhoria livre incompatível com o tipo Atributo',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou demais UUIDs em formato inválido',
  })
  async linkBiography(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkSheetBiographyDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.linkBiography(id, dto, currentUser);
    return SheetResponseDto.fromEntity(sheet);
  }

  @Delete(':id/biography')
  @ApiOperation({
    summary:
      'Desvincula a biografia da ficha, limpando as entradas de melhorias e proficiências de biografia',
  })
  @ApiOkResponse({ type: SheetResponseDto })
  @ApiNotFoundResponse({
    description: 'Ficha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({ description: 'ID de ficha em formato inválido' })
  async unlinkBiography(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.unlinkBiography(id, currentUser);
    return SheetResponseDto.fromEntity(sheet);
  }

  @Put(':id/proficiency-adjustments/:adjustmentId')
  @ApiOperation({
    summary:
      'Resolve um conflito de proficiência, escolhendo uma propriedade substituta para uma proficiência em conflito',
  })
  @ApiOkResponse({ type: SheetResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ajuste de proficiência não encontrado, ou propriedade selecionada não encontrada',
  })
  @ApiConflictResponse({
    description:
      'A propriedade selecionada já está aplicada na ficha',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha, ajuste ou propriedade em formato inválido',
  })
  async resolveProficiencyAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('adjustmentId', ParseUUIDPipe) adjustmentId: string,
    @Body() dto: ResolveProficiencyAdjustmentDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.resolveProficiencyAdjustment(
      id,
      adjustmentId,
      dto,
      currentUser,
    );
    return SheetResponseDto.fromEntity(sheet);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma ficha' })
  @ApiNoContentResponse({ description: 'Ficha removida com sucesso' })
  @ApiNotFoundResponse({
    description: 'Ficha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({ description: 'ID de ficha em formato inválido' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.sheetsService.remove(id, currentUser);
  }
}
