import { PartialType } from '@nestjs/swagger';
import { CreateAmmunitionDto } from './create-ammunition.dto';

export class UpdateAmmunitionDto extends PartialType(CreateAmmunitionDto) {}
