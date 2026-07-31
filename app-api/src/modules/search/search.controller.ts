import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
      'Busca entidades linkáveis (usuários, criaturas, tags, locais, raças, eras, eventos, divindades, personagens, organizações, famílias, equipamentos, materiais, consumíveis, munições, utilitários, regras, perícias, condições, treinamentos, talentos, técnicas e magias) por nome, para uso em menções (@mention)',
  })
  @ApiOkResponse({ type: [SearchResultItemResponseDto] })
  @ApiBadRequestResponse({
    description: 'Texto de busca ausente ou vazio',
  })
  async search(
    @Query() query: SearchQueryDto,
  ): Promise<SearchResultItemResponseDto[]> {
    return this.searchService.search(query.query);
  }
}
