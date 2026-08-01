import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GoogleAccess } from '../auth/decorators/google-access.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoogleAccessGuard } from '../auth/guards/google-access.guard';
import { CurrencyResponseDto } from './dto/currency-response.dto';
import { CurrenciesService } from './currencies.service';

@ApiTags('currencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as moedas' })
  @ApiOkResponse({ type: [CurrencyResponseDto] })
  async findAll(): Promise<CurrencyResponseDto[]> {
    const currencies = await this.currenciesService.findAll();
    return currencies.map((currency) =>
      CurrencyResponseDto.fromEntity(currency),
    );
  }
}
