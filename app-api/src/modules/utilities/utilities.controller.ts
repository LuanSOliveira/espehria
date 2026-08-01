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
import { CreateUtilityDto } from './dto/create-utility.dto';
import { UpdateUtilityDto } from './dto/update-utility.dto';
import { FindUtilitiesQueryDto } from './dto/find-utilities-query.dto';
import { UtilityResponseDto } from './dto/utility-response.dto';
import { UtilityListItemResponseDto } from './dto/utility-list-item-response.dto';
import { PaginatedUtilitiesResponseDto } from './dto/paginated-utilities-response.dto';
import { UtilitiesService } from './utilities.service';

@ApiTags('utilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('utilities')
export class UtilitiesController {
  constructor(private readonly utilitiesService: UtilitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um utilitário' })
  @ApiCreatedResponse({ type: UtilityResponseDto })
  @ApiConflictResponse({ description: 'Já existe um utilitário com este nome' })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas, ou a moeda informada não existe',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateUtilityDto): Promise<UtilityResponseDto> {
    const utility = await this.utilitiesService.create(dto);
    return UtilityResponseDto.fromEntity(utility);
  }

  @Get()
  @ApiOperation({ summary: 'Lista utilitários com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedUtilitiesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindUtilitiesQueryDto,
  ): Promise<PaginatedUtilitiesResponseDto> {
    const { data, total, page, perPage } =
      await this.utilitiesService.findAllPaginated(query);

    return {
      data: data.map((utility) =>
        UtilityListItemResponseDto.fromEntity(utility),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um utilitário pelo id' })
  @ApiOkResponse({ type: UtilityResponseDto })
  @ApiNotFoundResponse({ description: 'Utilitário não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de utilitário em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UtilityResponseDto> {
    const utility = await this.utilitiesService.findById(id);
    if (!utility) {
      throw new NotFoundException('Utilitário não encontrado.');
    }
    return UtilityResponseDto.fromEntity(utility);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um utilitário' })
  @ApiOkResponse({ type: UtilityResponseDto })
  @ApiNotFoundResponse({
    description: 'Utilitário, uma ou mais tags, ou a moeda informados não foram encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe um utilitário com este nome' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUtilityDto,
  ): Promise<UtilityResponseDto> {
    const utility = await this.utilitiesService.update(id, dto);
    return UtilityResponseDto.fromEntity(utility);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um utilitário' })
  @ApiNoContentResponse({ description: 'Utilitário removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Utilitário não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de utilitário em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.utilitiesService.remove(id);
  }
}
