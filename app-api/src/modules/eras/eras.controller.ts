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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';
import { FindErasQueryDto } from './dto/find-eras-query.dto';
import { EraResponseDto } from './dto/era-response.dto';
import { EraListItemResponseDto } from './dto/era-list-item-response.dto';
import { PaginatedErasResponseDto } from './dto/paginated-eras-response.dto';
import { EraOptionResponseDto } from './dto/era-option-response.dto';
import { ErasService } from './eras.service';

@ApiTags('eras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma era' })
  @ApiCreatedResponse({ type: EraResponseDto })
  @ApiConflictResponse({ description: 'Nome da era já existe' })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ordem fora do intervalo válido ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateEraDto): Promise<EraResponseDto> {
    const era = await this.erasService.create(dto);
    return EraResponseDto.fromEntity(era);
  }

  @Get()
  @ApiOperation({ summary: 'Lista eras com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedErasResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindErasQueryDto,
  ): Promise<PaginatedErasResponseDto> {
    const { data, total, page, perPage } =
      await this.erasService.findAllPaginated(query);

    return {
      data: data.map((era) => EraListItemResponseDto.fromEntity(era)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get('all')
  @ApiOperation({ summary: 'Lista todas as eras ordenadas' })
  @ApiOkResponse({ type: [EraOptionResponseDto] })
  async findAllOrdered(): Promise<EraOptionResponseDto[]> {
    const eras = await this.erasService.findAllOrdered();
    return eras.map((era) => EraOptionResponseDto.fromEntity(era));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma era pelo id' })
  @ApiOkResponse({ type: EraResponseDto })
  @ApiNotFoundResponse({ description: 'Era não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de era em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EraResponseDto> {
    const era = await this.erasService.findById(id);
    if (!era) {
      throw new NotFoundException('Era não encontrada.');
    }
    return EraResponseDto.fromEntity(era);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma era' })
  @ApiOkResponse({ type: EraResponseDto })
  @ApiConflictResponse({ description: 'Nome da era já existe' })
  @ApiNotFoundResponse({
    description: 'Era ou uma ou mais tags não encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ordem fora do intervalo válido ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEraDto,
  ): Promise<EraResponseDto> {
    const era = await this.erasService.update(id, dto);
    return EraResponseDto.fromEntity(era);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma era' })
  @ApiNoContentResponse({ description: 'Era removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Era não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de era em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.erasService.remove(id);
  }
}
