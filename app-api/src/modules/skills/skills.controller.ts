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
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { FindSkillsQueryDto } from './dto/find-skills-query.dto';
import { SkillResponseDto } from './dto/skill-response.dto';
import { SkillListItemResponseDto } from './dto/skill-list-item-response.dto';
import { PaginatedSkillsResponseDto } from './dto/paginated-skills-response.dto';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma perícia' })
  @ApiCreatedResponse({ type: SkillResponseDto })
  @ApiConflictResponse({ description: 'Nome da perícia já existe' })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({ description: 'Dados obrigatórios ausentes' })
  async create(@Body() dto: CreateSkillDto): Promise<SkillResponseDto> {
    const skill = await this.skillsService.create(dto);
    return SkillResponseDto.fromEntity(skill);
  }

  @Get()
  @ApiOperation({ summary: 'Lista perícias com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedSkillsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindSkillsQueryDto,
  ): Promise<PaginatedSkillsResponseDto> {
    const { data, total, page, perPage } =
      await this.skillsService.findAllPaginated(query);

    return {
      data: data.map((skill) => SkillListItemResponseDto.fromEntity(skill)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma perícia pelo id' })
  @ApiOkResponse({ type: SkillResponseDto })
  @ApiNotFoundResponse({ description: 'Perícia não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de perícia em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SkillResponseDto> {
    const skill = await this.skillsService.findById(id);
    if (!skill) {
      throw new NotFoundException('Perícia não encontrada.');
    }
    return SkillResponseDto.fromEntity(skill);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma perícia' })
  @ApiOkResponse({ type: SkillResponseDto })
  @ApiNotFoundResponse({
    description: 'Perícia não encontrada ou uma ou mais tags não encontradas',
  })
  @ApiConflictResponse({ description: 'Nome da perícia já existe' })
  @ApiBadRequestResponse({ description: 'ID de perícia em formato inválido' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillResponseDto> {
    const skill = await this.skillsService.update(id, dto);
    return SkillResponseDto.fromEntity(skill);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma perícia' })
  @ApiNoContentResponse({ description: 'Perícia removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Perícia não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de perícia em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.skillsService.remove(id);
  }
}
