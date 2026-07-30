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
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { FindCharactersQueryDto } from './dto/find-characters-query.dto';
import { CharacterResponseDto } from './dto/character-response.dto';
import { CharacterListItemResponseDto } from './dto/character-list-item-response.dto';
import { PaginatedCharactersResponseDto } from './dto/paginated-characters-response.dto';
import { CharactersService } from './characters.service';

@ApiTags('characters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um personagem' })
  @ApiCreatedResponse({ type: CharacterResponseDto })
  @ApiNotFoundResponse({
    description:
      'Raça não encontrada, uma ou mais tags não encontradas, família primária não encontrada, ou família secundária não encontrada',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, dados obrigatórios ausentes, ID em formato inválido, ou família primária e secundária são a mesma família',
  })
  async create(@Body() dto: CreateCharacterDto): Promise<CharacterResponseDto> {
    const character = await this.charactersService.create(dto);
    const organizations =
      await this.charactersService.findOrganizationsForCharacter(character.id);
    return CharacterResponseDto.fromEntity(character, organizations);
  }

  @Get()
  @ApiOperation({ summary: 'Lista personagens com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedCharactersResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindCharactersQueryDto,
  ): Promise<PaginatedCharactersResponseDto> {
    const { data, total, page, perPage } =
      await this.charactersService.findAllPaginated(query);

    return {
      data: data.map((character) =>
        CharacterListItemResponseDto.fromEntity(character),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um personagem pelo id' })
  @ApiOkResponse({ type: CharacterResponseDto })
  @ApiNotFoundResponse({ description: 'Personagem não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de personagem em formato inválido',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CharacterResponseDto> {
    const character = await this.charactersService.findById(id);
    if (!character) {
      throw new NotFoundException('Personagem não encontrado.');
    }
    const organizations =
      await this.charactersService.findOrganizationsForCharacter(id);
    return CharacterResponseDto.fromEntity(character, organizations);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um personagem' })
  @ApiOkResponse({ type: CharacterResponseDto })
  @ApiNotFoundResponse({
    description:
      'Personagem não encontrado, raça não encontrada, uma ou mais tags não encontradas, família primária não encontrada, ou família secundária não encontrada',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ID em formato inválido, ou família primária e secundária são a mesma família',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCharacterDto,
  ): Promise<CharacterResponseDto> {
    const character = await this.charactersService.update(id, dto);
    const organizations =
      await this.charactersService.findOrganizationsForCharacter(id);
    return CharacterResponseDto.fromEntity(character, organizations);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um personagem' })
  @ApiNoContentResponse({ description: 'Personagem removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Personagem não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de personagem em formato inválido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.charactersService.remove(id);
  }
}
