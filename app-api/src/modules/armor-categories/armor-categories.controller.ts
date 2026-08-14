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
import { ArmorCategoryResponseDto } from './dto/armor-category-response.dto';
import { ArmorCategoriesService } from './armor-categories.service';

@ApiTags('armor-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('armor-categories')
export class ArmorCategoriesController {
  constructor(
    private readonly armorCategoriesService: ArmorCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as categorias de armadura' })
  @ApiOkResponse({ type: [ArmorCategoryResponseDto] })
  async findAll(): Promise<ArmorCategoryResponseDto[]> {
    const armorCategories = await this.armorCategoriesService.findAll();
    return armorCategories.map((armorCategory) =>
      ArmorCategoryResponseDto.fromEntity(armorCategory),
    );
  }
}
