import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
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
import { UpdateSheetKnowledgeNoteDto } from './dto/update-sheet-knowledge-note.dto';
import { AddCharacteristicExtraDto } from './dto/add-characteristic-extra.dto';
import { AddTrainingExtraDto } from './dto/add-training-extra.dto';
import { AddTalentExtraDto } from './dto/add-talent-extra.dto';
import { FillTrainingSlotDto } from './dto/fill-training-slot.dto';
import { FindSheetAbilityCandidatesQueryDto } from './dto/find-sheet-ability-candidates-query.dto';
import { PaginatedSheetAbilityCandidatesResponseDto } from './dto/paginated-sheet-ability-candidates-response.dto';
import { SheetAbilityCandidateResponseDto } from './dto/sheet-ability-candidate-response.dto';
import { SheetAbilitiesResponseDto } from './dto/sheet-abilities-response.dto';
import { SheetAbilitiesMutationResponseDto } from './dto/sheet-abilities-mutation-response.dto';
import { SheetCharacteristicsAbilitiesResponseDto } from './dto/sheet-characteristics-abilities-response.dto';
import { SheetTrainingsAbilitiesResponseDto } from './dto/sheet-trainings-abilities-response.dto';
import { SheetTalentsAbilitiesResponseDto } from './dto/sheet-talents-abilities-response.dto';
import { SheetTrainingSlotResponseDto } from './dto/sheet-training-slot-response.dto';
import { SheetAbilityCardResponseDto } from './dto/sheet-ability-card-response.dto';
import { SheetAbilityOriginResponseDto } from './dto/sheet-ability-origin-response.dto';
import {
  SheetAbilitiesData,
  SheetAbilityCard,
  SheetAbilityMutationResult,
  SheetsService,
} from './sheets.service';

@ApiTags('sheets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sheets')
export class SheetsController {
  constructor(
    private readonly sheetsService: SheetsService,
    private readonly campaignsService: CampaignsService,
  ) {}

  private toCardDto(card: SheetAbilityCard): SheetAbilityCardResponseDto {
    return SheetAbilityCardResponseDto.fromRaw({
      id: card.id,
      name: card.name,
      level: card.level,
      tags: card.tags,
      requirementsMet: card.requirementsMet,
      origin: card.origin
        ? SheetAbilityOriginResponseDto.fromRaw(card.origin)
        : null,
    });
  }

  private toAbilitiesResponseDto(
    data: SheetAbilitiesData,
  ): SheetAbilitiesResponseDto {
    return SheetAbilitiesResponseDto.fromRaw({
      characteristics: SheetCharacteristicsAbilitiesResponseDto.fromRaw({
        inherited: data.characteristics.inherited.map((card) =>
          this.toCardDto(card),
        ),
        extras: data.characteristics.extras.map((card) => this.toCardDto(card)),
      }),
      trainings: SheetTrainingsAbilitiesResponseDto.fromRaw({
        slots: data.trainings.slots.map((slot) =>
          SheetTrainingSlotResponseDto.fromRaw({
            slotIndex: slot.slotIndex,
            unlockedAtLevel: slot.unlockedAtLevel,
            training: slot.training ? this.toCardDto(slot.training) : null,
          }),
        ),
        inherited: data.trainings.inherited.map((card) => this.toCardDto(card)),
        extras: data.trainings.extras.map((card) => this.toCardDto(card)),
      }),
      talents: SheetTalentsAbilitiesResponseDto.fromRaw({
        inherited: data.talents.inherited.map((card) => this.toCardDto(card)),
        extras: data.talents.extras.map((card) => this.toCardDto(card)),
      }),
    });
  }

  private toMutationResponseDto(
    result: SheetAbilityMutationResult,
  ): SheetAbilitiesMutationResponseDto {
    return SheetAbilitiesMutationResponseDto.fromRaw({
      sheet: SheetResponseDto.fromEntity(result.sheet),
      abilities: this.toAbilitiesResponseDto(result.abilities),
    });
  }

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
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou atributo chave não encontrado',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem inválida, nível fora do intervalo válido, IDs em formato inválido (incluindo armorClassKeyAttributeId), PV atual ou temporário em formato inválido (devem ser inteiros), ou outros parâmetros de validação inválidos',
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
      'Vincula ou troca a raça da ficha, substituindo completamente as entradas de melhorias, defeitos, proficiências e saberes da raça anterior',
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
      'Desvincula a raça da ficha, limpando as entradas de melhorias, defeitos, proficiências e saberes da raça',
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
      'Vincula ou troca a biografia da ficha, incluindo no snapshot melhorias de atributo, proficiências, saberes e demais melhorias da biografia',
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
      'Desvincula a biografia da ficha, limpando as entradas de melhorias, proficiências e saberes de biografia',
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
    description: 'A propriedade selecionada já está aplicada na ficha',
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

  @Put(':id/knowledge-notes/:knowledgeId')
  @ApiOperation({
    summary:
      'Salva ou limpa a nota livre associada a um saber editável da ficha',
  })
  @ApiOkResponse({ type: SheetResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou saber (knowledgeId) não encontrado nesta ficha',
  })
  @ApiConflictResponse({
    description:
      'O saber referenciado não permite anotações (editable = false)',
  })
  @ApiBadRequestResponse({
    description:
      'ID de ficha ou de saber em formato inválido, ou nota ausente/inválida (deve ser string com máx. 2000 caracteres)',
  })
  async updateKnowledgeNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('knowledgeId', ParseUUIDPipe) knowledgeId: string,
    @Body() dto: UpdateSheetKnowledgeNoteDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetResponseDto> {
    const sheet = await this.sheetsService.updateKnowledgeNote(
      id,
      knowledgeId,
      dto,
      currentUser,
    );
    return SheetResponseDto.fromEntity(sheet);
  }

  @Get(':id/abilities')
  @ApiOperation({
    summary:
      'Lista consolidada das habilidades da ficha (Características/Treinamentos/Talentos herdados, slots de Treinamento e extras), com status de requisitos',
  })
  @ApiOkResponse({ type: SheetAbilitiesResponseDto })
  @ApiNotFoundResponse({
    description: 'Ficha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({ description: 'ID de ficha em formato inválido' })
  async getAbilities(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesResponseDto> {
    const data = await this.sheetsService.getAbilities(id, currentUser);
    return this.toAbilitiesResponseDto(data);
  }

  @Get(':id/abilities/candidates')
  @ApiOperation({
    summary:
      'Lista paginada de candidatos do catálogo (Treinamento/Talento/Característica) para vínculo à ficha, com alreadyPresent/requirementsMet já avaliados no servidor',
  })
  @ApiOkResponse({ type: PaginatedSheetAbilityCandidatesResponseDto })
  @ApiNotFoundResponse({
    description: 'Ficha não encontrada ou não pertence ao usuário',
  })
  @ApiBadRequestResponse({
    description:
      'ID de ficha em formato inválido, entityType diferente de training/talent/characteristic, ou parâmetros de paginação/filtro inválidos',
  })
  async findAbilityCandidates(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FindSheetAbilityCandidatesQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<PaginatedSheetAbilityCandidatesResponseDto> {
    const { data, total, page, perPage } =
      await this.sheetsService.findAbilityCandidates(id, query, currentUser);

    return {
      data: data.map((candidate) =>
        SheetAbilityCandidateResponseDto.fromRaw(candidate),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Post(':id/characteristics/extras')
  @ApiOperation({ summary: 'Adiciona uma característica extra à ficha' })
  @ApiCreatedResponse({ type: SheetAbilitiesMutationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou característica não encontrada',
  })
  @ApiConflictResponse({
    description:
      'Item já vinculado à ficha (herdado, slot ou extra), ou requisitos não atendidos',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou característica em formato inválido',
  })
  async addCharacteristicExtra(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCharacteristicExtraDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesMutationResponseDto> {
    const result = await this.sheetsService.addCharacteristicExtra(
      id,
      dto,
      currentUser,
    );
    return this.toMutationResponseDto(result);
  }

  @Delete(':id/characteristics/extras/:characteristicId')
  @ApiOperation({ summary: 'Remove uma característica extra da ficha' })
  @ApiOkResponse({ type: SheetAbilitiesMutationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou característica não encontrada como extra desta ficha',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou característica em formato inválido',
  })
  async removeCharacteristicExtra(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('characteristicId', ParseUUIDPipe) characteristicId: string,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesMutationResponseDto> {
    const result = await this.sheetsService.removeCharacteristicExtra(
      id,
      characteristicId,
      currentUser,
    );
    return this.toMutationResponseDto(result);
  }

  @Post(':id/trainings/extras')
  @ApiOperation({ summary: 'Adiciona um treinamento extra à ficha' })
  @ApiCreatedResponse({ type: SheetAbilitiesMutationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou treinamento não encontrado',
  })
  @ApiConflictResponse({
    description:
      'Item já vinculado à ficha (herdado, slot ou extra), ou requisitos não atendidos',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou treinamento em formato inválido',
  })
  async addTrainingExtra(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTrainingExtraDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesMutationResponseDto> {
    const result = await this.sheetsService.addTrainingExtra(
      id,
      dto,
      currentUser,
    );
    return this.toMutationResponseDto(result);
  }

  @Delete(':id/trainings/extras/:trainingId')
  @ApiOperation({ summary: 'Remove um treinamento extra da ficha' })
  @ApiOkResponse({ type: SheetAbilitiesMutationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou treinamento não encontrado como extra desta ficha',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou treinamento em formato inválido',
  })
  async removeTrainingExtra(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('trainingId', ParseUUIDPipe) trainingId: string,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesMutationResponseDto> {
    const result = await this.sheetsService.removeTrainingExtra(
      id,
      trainingId,
      currentUser,
    );
    return this.toMutationResponseDto(result);
  }

  @Post(':id/talents/extras')
  @ApiOperation({ summary: 'Adiciona um talento extra à ficha' })
  @ApiCreatedResponse({ type: SheetAbilitiesMutationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou talento não encontrado',
  })
  @ApiConflictResponse({
    description:
      'Item já vinculado à ficha (herdado, slot ou extra), ou requisitos não atendidos',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou talento em formato inválido',
  })
  async addTalentExtra(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTalentExtraDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesMutationResponseDto> {
    const result = await this.sheetsService.addTalentExtra(
      id,
      dto,
      currentUser,
    );
    return this.toMutationResponseDto(result);
  }

  @Delete(':id/talents/extras/:talentId')
  @ApiOperation({ summary: 'Remove um talento extra da ficha' })
  @ApiOkResponse({ type: SheetAbilitiesMutationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou talento não encontrado como extra desta ficha',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou talento em formato inválido',
  })
  async removeTalentExtra(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('talentId', ParseUUIDPipe) talentId: string,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesMutationResponseDto> {
    const result = await this.sheetsService.removeTalentExtra(
      id,
      talentId,
      currentUser,
    );
    return this.toMutationResponseDto(result);
  }

  @Put(':id/trainings/slots/:slotIndex/training')
  @ApiOperation({ summary: 'Preenche um slot de treinamento vazio da ficha' })
  @ApiOkResponse({ type: SheetAbilitiesMutationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, slot não encontrado nesta ficha, ou treinamento não encontrado',
  })
  @ApiConflictResponse({
    description:
      'Slot já preenchido, item já vinculado à ficha (herdado, slot ou extra), ou requisitos não atendidos',
  })
  @ApiBadRequestResponse({
    description:
      'ID de ficha, índice de slot ou de treinamento em formato inválido',
  })
  async fillTrainingSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('slotIndex', ParseIntPipe) slotIndex: number,
    @Body() dto: FillTrainingSlotDto,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesMutationResponseDto> {
    const result = await this.sheetsService.fillTrainingSlot(
      id,
      slotIndex,
      dto,
      currentUser,
    );
    return this.toMutationResponseDto(result);
  }

  @Delete(':id/trainings/slots/:slotIndex/training')
  @ApiOperation({
    summary: 'Esvazia um slot de treinamento preenchido da ficha',
  })
  @ApiOkResponse({ type: SheetAbilitiesMutationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Ficha não encontrada ou não pertence ao usuário, ou slot vazio/não encontrado nesta ficha',
  })
  @ApiBadRequestResponse({
    description: 'ID de ficha ou índice de slot em formato inválido',
  })
  async emptyTrainingSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('slotIndex', ParseIntPipe) slotIndex: number,
    @CurrentUser() currentUser: User,
  ): Promise<SheetAbilitiesMutationResponseDto> {
    const result = await this.sheetsService.emptyTrainingSlot(
      id,
      slotIndex,
      currentUser,
    );
    return this.toMutationResponseDto(result);
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
