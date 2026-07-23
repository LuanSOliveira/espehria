import { PartialType } from '@nestjs/swagger';
import { CreateDivinityDto } from './create-divinity.dto';

export class UpdateDivinityDto extends PartialType(CreateDivinityDto) {}
