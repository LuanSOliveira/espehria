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
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { FindTagsQueryDto } from './dto/find-tags-query.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import { PaginatedTagsResponseDto } from './dto/paginated-tags-response.dto';
import { TagsService } from './tags.service';

@ApiTags('tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma tag' })
  @ApiCreatedResponse({ type: TagResponseDto })
  @ApiConflictResponse({ description: 'Este nome já está em uso.' })
  @ApiBadRequestResponse({
    description: 'Nome ou cor ausentes ou formato de cor inválido',
  })
  async create(@Body() dto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.tagsService.create(dto);
    return TagResponseDto.fromEntity(tag);
  }

  @Get()
  @ApiOperation({ summary: 'Lista tags com paginação e filtro por nome' })
  @ApiOkResponse({ type: PaginatedTagsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindTagsQueryDto,
  ): Promise<PaginatedTagsResponseDto> {
    const { data, total, page, perPage } =
      await this.tagsService.findAllPaginated(query);

    return {
      data: data.map((tag) => TagResponseDto.fromEntity(tag)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma tag pelo id' })
  @ApiOkResponse({ type: TagResponseDto })
  @ApiNotFoundResponse({ description: 'Tag não encontrada.' })
  @ApiBadRequestResponse({ description: 'ID de tag em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TagResponseDto> {
    const tag = await this.tagsService.findById(id);
    if (!tag) {
      throw new NotFoundException('Tag não encontrada.');
    }
    return TagResponseDto.fromEntity(tag);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma tag' })
  @ApiOkResponse({ type: TagResponseDto })
  @ApiNotFoundResponse({ description: 'Tag não encontrada.' })
  @ApiConflictResponse({ description: 'Este nome já está em uso.' })
  @ApiBadRequestResponse({
    description: 'ID de tag em formato inválido ou dados inválidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    const tag = await this.tagsService.update(id, dto);
    return TagResponseDto.fromEntity(tag);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma tag' })
  @ApiNoContentResponse({ description: 'Tag removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Tag não encontrada.' })
  @ApiBadRequestResponse({ description: 'ID de tag em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tagsService.remove(id);
  }
}
