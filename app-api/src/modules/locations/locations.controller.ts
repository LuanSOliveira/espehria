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
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FindLocationsQueryDto } from './dto/find-locations-query.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { LocationListItemResponseDto } from './dto/location-list-item-response.dto';
import { PaginatedLocationsResponseDto } from './dto/paginated-locations-response.dto';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um local' })
  @ApiCreatedResponse({ type: LocationResponseDto })
  @ApiConflictResponse({ description: 'Nome do local já existe' })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags não foram encontradas ou um ou mais locais (pontos de interesse) não foram encontrados',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateLocationDto): Promise<LocationResponseDto> {
    const location = await this.locationsService.create(dto);
    return LocationResponseDto.fromEntity(location);
  }

  @Get()
  @ApiOperation({ summary: 'Lista locais com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedLocationsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindLocationsQueryDto,
  ): Promise<PaginatedLocationsResponseDto> {
    const { data, total, page, perPage } =
      await this.locationsService.findAllPaginated(query);

    return {
      data: data.map((location) =>
        LocationListItemResponseDto.fromEntity(location),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um local pelo id' })
  @ApiOkResponse({ type: LocationResponseDto })
  @ApiNotFoundResponse({ description: 'Local não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de local em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LocationResponseDto> {
    const location = await this.locationsService.findById(id);
    if (!location) {
      throw new NotFoundException('Local não encontrado.');
    }
    return LocationResponseDto.fromEntity(location);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um local' })
  @ApiOkResponse({ type: LocationResponseDto })
  @ApiNotFoundResponse({
    description:
      'Local, uma ou mais tags ou um ou mais pontos de interesse não encontrados',
  })
  @ApiConflictResponse({ description: 'Nome do local já existe' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    const location = await this.locationsService.update(id, dto);
    return LocationResponseDto.fromEntity(location);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um local' })
  @ApiNoContentResponse({ description: 'Local removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Local não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de local em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.locationsService.remove(id);
  }
}
