import { PartialType } from '@nestjs/swagger';
import { CreateEnhancementDto } from './create-enhancement.dto';

export class UpdateEnhancementDto extends PartialType(CreateEnhancementDto) {}
