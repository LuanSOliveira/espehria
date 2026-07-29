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
import { CreateDivinityDto } from './dto/create-divinity.dto';
import { UpdateDivinityDto } from './dto/update-divinity.dto';
import { FindDivinitiesQueryDto } from './dto/find-divinities-query.dto';
import { DivinityResponseDto } from './dto/divinity-response.dto';
import { DivinityListItemResponseDto } from './dto/divinity-list-item-response.dto';
import { PaginatedDivinitiesResponseDto } from './dto/paginated-divinities-response.dto';
import { DivinityCategoryResponseDto } from './dto/divinity-category-response.dto';
import { DivinitiesService } from './divinities.service';

@ApiTags('divinities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('divinities')
export class DivinitiesController {
  constructor(private readonly divinitiesService: DivinitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma divindade' })
  @ApiCreatedResponse({ type: DivinityResponseDto })
  @ApiConflictResponse({ description: 'Nome da divindade já existe' })
  @ApiNotFoundResponse({
    description: 'Categoria não encontrada ou uma ou mais tags não encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateDivinityDto): Promise<DivinityResponseDto> {
    const divinity = await this.divinitiesService.create(dto);
    return DivinityResponseDto.fromEntity(divinity);
  }

  @Get()
  @ApiOperation({ summary: 'Lista divindades com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedDivinitiesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindDivinitiesQueryDto,
  ): Promise<PaginatedDivinitiesResponseDto> {
    const { data, total, page, perPage } =
      await this.divinitiesService.findAllPaginated(query);

    return {
      data: data.map((divinity) =>
        DivinityListItemResponseDto.fromEntity(divinity),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lista todas as categorias de divindades' })
  @ApiOkResponse({ type: [DivinityCategoryResponseDto] })
  async findAllCategories(): Promise<DivinityCategoryResponseDto[]> {
    const categories = await this.divinitiesService.findAllCategories();
    return categories.map((category) =>
      DivinityCategoryResponseDto.fromEntity(category),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma divindade pelo id' })
  @ApiOkResponse({ type: DivinityResponseDto })
  @ApiNotFoundResponse({ description: 'Divindade não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de divindade em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DivinityResponseDto> {
    const divinity = await this.divinitiesService.findById(id);
    if (!divinity) {
      throw new NotFoundException('Divindade não encontrada.');
    }
    return DivinityResponseDto.fromEntity(divinity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma divindade' })
  @ApiOkResponse({ type: DivinityResponseDto })
  @ApiConflictResponse({ description: 'Nome da divindade já existe' })
  @ApiNotFoundResponse({
    description: 'Divindade, categoria ou uma ou mais tags não encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDivinityDto,
  ): Promise<DivinityResponseDto> {
    const divinity = await this.divinitiesService.update(id, dto);
    return DivinityResponseDto.fromEntity(divinity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma divindade' })
  @ApiNoContentResponse({ description: 'Divindade removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Divindade não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de divindade em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.divinitiesService.remove(id);
  }
}
