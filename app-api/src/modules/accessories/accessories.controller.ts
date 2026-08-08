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
import { CreateAccessoryDto } from './dto/create-accessory.dto';
import { UpdateAccessoryDto } from './dto/update-accessory.dto';
import { FindAccessoriesQueryDto } from './dto/find-accessories-query.dto';
import { AccessoryResponseDto } from './dto/accessory-response.dto';
import { AccessoryListItemResponseDto } from './dto/accessory-list-item-response.dto';
import { PaginatedAccessoriesResponseDto } from './dto/paginated-accessories-response.dto';
import { AccessoriesService } from './accessories.service';

@ApiTags('accessories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('accessories')
export class AccessoriesController {
  constructor(private readonly accessoriesService: AccessoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um acessório' })
  @ApiCreatedResponse({ type: AccessoryResponseDto })
  @ApiConflictResponse({ description: 'Já existe um acessório com este nome' })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags não foram encontradas, ou a moeda informada não existe',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(
    @Body() dto: CreateAccessoryDto,
  ): Promise<AccessoryResponseDto> {
    const accessory = await this.accessoriesService.create(dto);
    return AccessoryResponseDto.fromEntity(accessory);
  }

  @Get()
  @ApiOperation({ summary: 'Lista acessórios com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedAccessoriesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindAccessoriesQueryDto,
  ): Promise<PaginatedAccessoriesResponseDto> {
    const { data, total, page, perPage } =
      await this.accessoriesService.findAllPaginated(query);

    return {
      data: data.map((accessory) =>
        AccessoryListItemResponseDto.fromEntity(accessory),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um acessório pelo id' })
  @ApiOkResponse({ type: AccessoryResponseDto })
  @ApiNotFoundResponse({ description: 'Acessório não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de acessório em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccessoryResponseDto> {
    const accessory = await this.accessoriesService.findById(id);
    if (!accessory) {
      throw new NotFoundException('Acessório não encontrado.');
    }
    return AccessoryResponseDto.fromEntity(accessory);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um acessório' })
  @ApiOkResponse({ type: AccessoryResponseDto })
  @ApiNotFoundResponse({
    description:
      'Acessório, uma ou mais tags, ou a moeda informados não foram encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe um acessório com este nome' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccessoryDto,
  ): Promise<AccessoryResponseDto> {
    const accessory = await this.accessoriesService.update(id, dto);
    return AccessoryResponseDto.fromEntity(accessory);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um acessório' })
  @ApiNoContentResponse({ description: 'Acessório removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Acessório não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de acessório em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.accessoriesService.remove(id);
  }
}
