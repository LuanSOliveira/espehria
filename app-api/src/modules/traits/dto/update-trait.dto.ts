import { PartialType } from '@nestjs/swagger';
import { CreateTraitDto } from './create-trait.dto';

export class UpdateTraitDto extends PartialType(CreateTraitDto) {}
