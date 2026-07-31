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
import { CreateTalentDto } from './dto/create-talent.dto';
import { UpdateTalentDto } from './dto/update-talent.dto';
import { FindTalentsQueryDto } from './dto/find-talents-query.dto';
import { TalentResponseDto } from './dto/talent-response.dto';
import { TalentListItemResponseDto } from './dto/talent-list-item-response.dto';
import { PaginatedTalentsResponseDto } from './dto/paginated-talents-response.dto';
import { TalentsService } from './talents.service';

@ApiTags('talents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('talents')
export class TalentsController {
  constructor(private readonly talentsService: TalentsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um talento' })
  @ApiCreatedResponse({ type: TalentResponseDto })
  @ApiConflictResponse({ description: 'Já existe um talento com este nome' })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({
    description: 'Dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateTalentDto): Promise<TalentResponseDto> {
    const talent = await this.talentsService.create(dto);
    return TalentResponseDto.fromEntity(talent);
  }

  @Get()
  @ApiOperation({ summary: 'Lista talentos com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedTalentsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindTalentsQueryDto,
  ): Promise<PaginatedTalentsResponseDto> {
    const { data, total, page, perPage } =
      await this.talentsService.findAllPaginated(query);

    return {
      data: data.map((talent) => TalentListItemResponseDto.fromEntity(talent)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um talento pelo id' })
  @ApiOkResponse({ type: TalentResponseDto })
  @ApiNotFoundResponse({ description: 'Talento não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de talento em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TalentResponseDto> {
    const talent = await this.talentsService.findById(id);
    if (!talent) {
      throw new NotFoundException('Talento não encontrado.');
    }
    return TalentResponseDto.fromEntity(talent);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um talento' })
  @ApiOkResponse({ type: TalentResponseDto })
  @ApiNotFoundResponse({
    description: 'Talento ou uma ou mais tags não encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe um talento com este nome' })
  @ApiBadRequestResponse({
    description: 'ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTalentDto,
  ): Promise<TalentResponseDto> {
    const talent = await this.talentsService.update(id, dto);
    return TalentResponseDto.fromEntity(talent);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um talento' })
  @ApiNoContentResponse({ description: 'Talento removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Talento não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de talento em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.talentsService.remove(id);
  }
}
