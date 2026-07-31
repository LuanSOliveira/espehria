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
import { AttributeResponseDto } from './dto/attribute-response.dto';
import { AttributesService } from './attributes.service';

@ApiTags('attributes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os atributos' })
  @ApiOkResponse({ type: [AttributeResponseDto] })
  async findAll(): Promise<AttributeResponseDto[]> {
    const attributes = await this.attributesService.findAll();
    return attributes.map((attribute) =>
      AttributeResponseDto.fromEntity(attribute),
    );
  }
}
