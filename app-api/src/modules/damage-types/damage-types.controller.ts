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
import { DamageTypeResponseDto } from './dto/damage-type-response.dto';
import { DamageTypesService } from './damage-types.service';

@ApiTags('damage-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('damage-types')
export class DamageTypesController {
  constructor(private readonly damageTypesService: DamageTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os tipos de dano' })
  @ApiOkResponse({ type: [DamageTypeResponseDto] })
  async findAll(): Promise<DamageTypeResponseDto[]> {
    const damageTypes = await this.damageTypesService.findAll();
    return damageTypes.map((damageType) =>
      DamageTypeResponseDto.fromEntity(damageType),
    );
  }
}
