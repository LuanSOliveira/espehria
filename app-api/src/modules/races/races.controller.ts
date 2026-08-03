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
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import { FindRacesQueryDto } from './dto/find-races-query.dto';
import { RaceResponseDto } from './dto/race-response.dto';
import { RaceListItemResponseDto } from './dto/race-list-item-response.dto';
import { PaginatedRacesResponseDto } from './dto/paginated-races-response.dto';
import { RaceCategoryResponseDto } from './dto/race-category-response.dto';
import { RacesService } from './races.service';

@ApiTags('races')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma raça' })
  @ApiCreatedResponse({ type: RaceResponseDto })
  @ApiConflictResponse({
    description:
      'Nome da raça já existe, ou violação de regra em Melhorias/Defeitos (duplicidade de combinação Tipo×Propriedade na mesma lista, exclusividade entre listas ou incompatibilidade entre o Tipo e a Propriedade selecionados)',
  })
  @ApiNotFoundResponse({
    description:
      'Categoria não encontrada, uma ou mais tags não encontradas, uma ou mais características não encontradas, um ou mais talentos não encontrados, ou tipos/propriedades de Melhorias/Defeitos não encontrados',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, dados obrigatórios ausentes, ou formato inválido de value/type/property em Melhorias/Defeitos (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas)',
  })
  async create(@Body() dto: CreateRaceDto): Promise<RaceResponseDto> {
    const { race, improvements, flaws } = await this.racesService.create(dto);
    return RaceResponseDto.fromEntity(race, { improvements, flaws });
  }

  @Get()
  @ApiOperation({ summary: 'Lista raças com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedRacesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindRacesQueryDto,
  ): Promise<PaginatedRacesResponseDto> {
    const { data, total, page, perPage } =
      await this.racesService.findAllPaginated(query);

    return {
      data: data.map((race) => RaceListItemResponseDto.fromEntity(race)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lista todas as categorias de raças' })
  @ApiOkResponse({ type: [RaceCategoryResponseDto] })
  async findAllCategories(): Promise<RaceCategoryResponseDto[]> {
    const categories = await this.racesService.findAllCategories();
    return categories.map((category) =>
      RaceCategoryResponseDto.fromEntity(category),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma raça pelo id' })
  @ApiOkResponse({ type: RaceResponseDto })
  @ApiNotFoundResponse({ description: 'Raça não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de raça em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RaceResponseDto> {
    const result = await this.racesService.findById(id);
    if (!result) {
      throw new NotFoundException('Raça não encontrada.');
    }
    return RaceResponseDto.fromEntity(result.race, {
      improvements: result.improvements,
      flaws: result.flaws,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma raça' })
  @ApiOkResponse({ type: RaceResponseDto })
  @ApiNotFoundResponse({
    description:
      'Raça, categoria, uma ou mais tags, uma ou mais características, um ou mais talentos não encontrados, ou tipos/propriedades de Melhorias/Defeitos não encontrados',
  })
  @ApiConflictResponse({
    description:
      'Nome da raça já existe, ou violação de regra em Melhorias/Defeitos (duplicidade de combinação Tipo×Propriedade na mesma lista, exclusividade entre listas ou incompatibilidade entre o Tipo e a Propriedade selecionados)',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ID em formato inválido, ou formato inválido de value/type/property em Melhorias/Defeitos (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRaceDto,
  ): Promise<RaceResponseDto> {
    const { race, improvements, flaws } = await this.racesService.update(
      id,
      dto,
    );
    return RaceResponseDto.fromEntity(race, { improvements, flaws });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma raça' })
  @ApiNoContentResponse({ description: 'Raça removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Raça não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de raça em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.racesService.remove(id);
  }
}
