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
import { CreateEnhancementDto } from './dto/create-enhancement.dto';
import { UpdateEnhancementDto } from './dto/update-enhancement.dto';
import { FindEnhancementsQueryDto } from './dto/find-enhancements-query.dto';
import { EnhancementResponseDto } from './dto/enhancement-response.dto';
import { EnhancementListItemResponseDto } from './dto/enhancement-list-item-response.dto';
import { PaginatedEnhancementsResponseDto } from './dto/paginated-enhancements-response.dto';
import { EnhancementsService } from './enhancements.service';

@ApiTags('enhancements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('enhancements')
export class EnhancementsController {
  constructor(private readonly enhancementsService: EnhancementsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um aprimoramento' })
  @ApiCreatedResponse({ type: EnhancementResponseDto })
  @ApiConflictResponse({
    description: 'Já existe um aprimoramento com este nome',
  })
  @ApiBadRequestResponse({
    description: 'Dados obrigatórios ausentes ou em formato inválido',
  })
  async create(
    @Body() dto: CreateEnhancementDto,
  ): Promise<EnhancementResponseDto> {
    const enhancement = await this.enhancementsService.create(dto);
    return EnhancementResponseDto.fromEntity(enhancement);
  }

  @Get()
  @ApiOperation({ summary: 'Lista aprimoramentos com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedEnhancementsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindEnhancementsQueryDto,
  ): Promise<PaginatedEnhancementsResponseDto> {
    const { data, total, page, perPage } =
      await this.enhancementsService.findAllPaginated(query);

    return {
      data: data.map((enhancement) =>
        EnhancementListItemResponseDto.fromEntity(enhancement),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um aprimoramento pelo id' })
  @ApiOkResponse({ type: EnhancementResponseDto })
  @ApiNotFoundResponse({ description: 'Aprimoramento não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de aprimoramento em formato inválido',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EnhancementResponseDto> {
    const enhancement = await this.enhancementsService.findById(id);
    if (!enhancement) {
      throw new NotFoundException('Aprimoramento não encontrado.');
    }
    return EnhancementResponseDto.fromEntity(enhancement);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um aprimoramento' })
  @ApiOkResponse({ type: EnhancementResponseDto })
  @ApiNotFoundResponse({ description: 'Aprimoramento não encontrado' })
  @ApiConflictResponse({
    description: 'Já existe um aprimoramento com este nome',
  })
  @ApiBadRequestResponse({
    description: 'ID em formato inválido ou dados inválidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnhancementDto,
  ): Promise<EnhancementResponseDto> {
    const enhancement = await this.enhancementsService.update(id, dto);
    return EnhancementResponseDto.fromEntity(enhancement);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um aprimoramento' })
  @ApiNoContentResponse({ description: 'Aprimoramento removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Aprimoramento não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de aprimoramento em formato inválido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.enhancementsService.remove(id);
  }
}
