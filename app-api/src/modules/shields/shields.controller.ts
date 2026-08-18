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
import { CreateShieldDto } from './dto/create-shield.dto';
import { UpdateShieldDto } from './dto/update-shield.dto';
import { FindShieldsQueryDto } from './dto/find-shields-query.dto';
import { ShieldResponseDto } from './dto/shield-response.dto';
import { ShieldListItemResponseDto } from './dto/shield-list-item-response.dto';
import { PaginatedShieldsResponseDto } from './dto/paginated-shields-response.dto';
import { ShieldsService } from './shields.service';

@ApiTags('shields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('shields')
export class ShieldsController {
  constructor(private readonly shieldsService: ShieldsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um escudo' })
  @ApiCreatedResponse({ type: ShieldResponseDto })
  @ApiConflictResponse({ description: 'Já existe um escudo com este nome' })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags não foram encontradas, ou a moeda informada não existe',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, dados obrigatórios ausentes, volume/penalidade de velocidade com mais de 1 casa decimal ou negativos, bônus de CA/dureza/pontos de vida negativos, ou nome ausente/vazio em algum item de encantamentos/aprimoramentos',
  })
  async create(@Body() dto: CreateShieldDto): Promise<ShieldResponseDto> {
    const shield = await this.shieldsService.create(dto);
    return ShieldResponseDto.fromEntity(shield);
  }

  @Get()
  @ApiOperation({ summary: 'Lista escudos com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedShieldsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindShieldsQueryDto,
  ): Promise<PaginatedShieldsResponseDto> {
    const { data, total, page, perPage } =
      await this.shieldsService.findAllPaginated(query);

    return {
      data: data.map((shield) => ShieldListItemResponseDto.fromEntity(shield)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um escudo pelo id' })
  @ApiOkResponse({ type: ShieldResponseDto })
  @ApiNotFoundResponse({ description: 'Escudo não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de escudo em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShieldResponseDto> {
    const shield = await this.shieldsService.findById(id);
    if (!shield) {
      throw new NotFoundException('Escudo não encontrado.');
    }
    return ShieldResponseDto.fromEntity(shield);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um escudo' })
  @ApiOkResponse({ type: ShieldResponseDto })
  @ApiNotFoundResponse({
    description:
      'Escudo, uma ou mais tags, ou a moeda informados não foram encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe um escudo com este nome' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ID em formato inválido, volume/penalidade de velocidade com mais de 1 casa decimal ou negativos, bônus de CA/dureza/pontos de vida negativos, ou nome ausente/vazio em algum item de encantamentos/aprimoramentos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShieldDto,
  ): Promise<ShieldResponseDto> {
    const shield = await this.shieldsService.update(id, dto);
    return ShieldResponseDto.fromEntity(shield);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um escudo' })
  @ApiNoContentResponse({ description: 'Escudo removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Escudo não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de escudo em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.shieldsService.remove(id);
  }
}
