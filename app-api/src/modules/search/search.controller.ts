import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultItemResponseDto } from './dto/search-result-item-response.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary:
      'Busca entidades linkáveis (campanhas, sessões planejadas, usuários, criaturas, tags, locais, raças, eras, eventos, divindades, personagens, organizações, famílias, equipamentos, materiais, consumíveis, munições, utilitários, regras, perícias, condições, treinamentos, talentos, técnicas, magias, características e biografias) por nome, para uso em menções (@mention). Campanhas e sessões planejadas aparecem apenas se pertencem ao usuário autenticado; usuários Google não veem esses tipos nos resultados',
  })
  @ApiOkResponse({ type: [SearchResultItemResponseDto] })
  @ApiBadRequestResponse({
    description: 'Texto de busca ausente ou vazio',
  })
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<SearchResultItemResponseDto[]> {
    return this.searchService.search(query.query, currentUser);
  }
}
