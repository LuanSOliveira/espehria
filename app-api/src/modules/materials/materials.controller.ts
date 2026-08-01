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
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { FindMaterialsQueryDto } from './dto/find-materials-query.dto';
import { MaterialResponseDto } from './dto/material-response.dto';
import { MaterialListItemResponseDto } from './dto/material-list-item-response.dto';
import { PaginatedMaterialsResponseDto } from './dto/paginated-materials-response.dto';
import { MaterialsService } from './materials.service';

@ApiTags('materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um material' })
  @ApiCreatedResponse({ type: MaterialResponseDto })
  @ApiConflictResponse({ description: 'Já existe um material com este nome' })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas, ou a moeda informada não existe',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateMaterialDto): Promise<MaterialResponseDto> {
    const material = await this.materialsService.create(dto);
    return MaterialResponseDto.fromEntity(material);
  }

  @Get()
  @ApiOperation({ summary: 'Lista materiais com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedMaterialsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindMaterialsQueryDto,
  ): Promise<PaginatedMaterialsResponseDto> {
    const { data, total, page, perPage } =
      await this.materialsService.findAllPaginated(query);

    return {
      data: data.map((material) =>
        MaterialListItemResponseDto.fromEntity(material),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um material pelo id' })
  @ApiOkResponse({ type: MaterialResponseDto })
  @ApiNotFoundResponse({ description: 'Material não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de material em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialsService.findById(id);
    if (!material) {
      throw new NotFoundException('Material não encontrado.');
    }
    return MaterialResponseDto.fromEntity(material);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um material' })
  @ApiOkResponse({ type: MaterialResponseDto })
  @ApiNotFoundResponse({
    description: 'Material, uma ou mais tags, ou a moeda informados não foram encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe um material com este nome' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialDto,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialsService.update(id, dto);
    return MaterialResponseDto.fromEntity(material);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um material' })
  @ApiNoContentResponse({ description: 'Material removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Material não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de material em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.materialsService.remove(id);
  }
}
