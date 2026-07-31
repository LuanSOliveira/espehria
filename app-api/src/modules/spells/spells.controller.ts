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
import { GoogleAccess } from '../auth/decorators/google-access.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoogleAccessGuard } from '../auth/guards/google-access.guard';
import { CreateSpellDto } from './dto/create-spell.dto';
import { UpdateSpellDto } from './dto/update-spell.dto';
import { FindSpellsQueryDto } from './dto/find-spells-query.dto';
import { SpellResponseDto } from './dto/spell-response.dto';
import { SpellListItemResponseDto } from './dto/spell-list-item-response.dto';
import { PaginatedSpellsResponseDto } from './dto/paginated-spells-response.dto';
import { SpellsService } from './spells.service';

@ApiTags('spells')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('spells')
export class SpellsController {
  constructor(private readonly spellsService: SpellsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma magia' })
  @ApiCreatedResponse({ type: SpellResponseDto })
  @ApiConflictResponse({ description: 'Já existe uma magia com este nome' })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateSpellDto): Promise<SpellResponseDto> {
    const spell = await this.spellsService.create(dto);
    return SpellResponseDto.fromEntity(spell);
  }

  @Get()
  @ApiOperation({ summary: 'Lista magias com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedSpellsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindSpellsQueryDto,
  ): Promise<PaginatedSpellsResponseDto> {
    const { data, total, page, perPage } =
      await this.spellsService.findAllPaginated(query);

    return {
      data: data.map((spell) => SpellListItemResponseDto.fromEntity(spell)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma magia pelo id' })
  @ApiOkResponse({ type: SpellResponseDto })
  @ApiNotFoundResponse({ description: 'Magia não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de magia em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SpellResponseDto> {
    const spell = await this.spellsService.findById(id);
    if (!spell) {
      throw new NotFoundException('Magia não encontrada.');
    }
    return SpellResponseDto.fromEntity(spell);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma magia' })
  @ApiOkResponse({ type: SpellResponseDto })
  @ApiNotFoundResponse({
    description: 'Magia ou uma ou mais tags não encontradas',
  })
  @ApiConflictResponse({ description: 'Já existe uma magia com este nome' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSpellDto,
  ): Promise<SpellResponseDto> {
    const spell = await this.spellsService.update(id, dto);
    return SpellResponseDto.fromEntity(spell);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma magia' })
  @ApiNoContentResponse({ description: 'Magia removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Magia não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de magia em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.spellsService.remove(id);
  }
}
