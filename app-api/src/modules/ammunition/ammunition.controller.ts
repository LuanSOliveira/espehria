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
import { CreateAmmunitionDto } from './dto/create-ammunition.dto';
import { UpdateAmmunitionDto } from './dto/update-ammunition.dto';
import { FindAmmunitionQueryDto } from './dto/find-ammunition-query.dto';
import { AmmunitionResponseDto } from './dto/ammunition-response.dto';
import { AmmunitionListItemResponseDto } from './dto/ammunition-list-item-response.dto';
import { PaginatedAmmunitionResponseDto } from './dto/paginated-ammunition-response.dto';
import { AmmunitionService } from './ammunition.service';

@ApiTags('ammunition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('ammunition')
export class AmmunitionController {
  constructor(private readonly ammunitionService: AmmunitionService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um item de munição' })
  @ApiCreatedResponse({ type: AmmunitionResponseDto })
  @ApiConflictResponse({
    description: 'Já existe um item de munição com este nome',
  })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(
    @Body() dto: CreateAmmunitionDto,
  ): Promise<AmmunitionResponseDto> {
    const ammunition = await this.ammunitionService.create(dto);
    return AmmunitionResponseDto.fromEntity(ammunition);
  }

  @Get()
  @ApiOperation({ summary: 'Lista munições com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedAmmunitionResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindAmmunitionQueryDto,
  ): Promise<PaginatedAmmunitionResponseDto> {
    const { data, total, page, perPage } =
      await this.ammunitionService.findAllPaginated(query);

    return {
      data: data.map((ammunition) =>
        AmmunitionListItemResponseDto.fromEntity(ammunition),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um item de munição pelo id' })
  @ApiOkResponse({ type: AmmunitionResponseDto })
  @ApiNotFoundResponse({ description: 'Item de munição não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de munição em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AmmunitionResponseDto> {
    const ammunition = await this.ammunitionService.findById(id);
    if (!ammunition) {
      throw new NotFoundException('Item de munição não encontrado.');
    }
    return AmmunitionResponseDto.fromEntity(ammunition);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um item de munição' })
  @ApiOkResponse({ type: AmmunitionResponseDto })
  @ApiNotFoundResponse({
    description: 'Item de munição ou uma ou mais tags não encontrados',
  })
  @ApiConflictResponse({
    description: 'Já existe um item de munição com este nome',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAmmunitionDto,
  ): Promise<AmmunitionResponseDto> {
    const ammunition = await this.ammunitionService.update(id, dto);
    return AmmunitionResponseDto.fromEntity(ammunition);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um item de munição' })
  @ApiNoContentResponse({ description: 'Item de munição removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Item de munição não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de munição em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.ammunitionService.remove(id);
  }
}
