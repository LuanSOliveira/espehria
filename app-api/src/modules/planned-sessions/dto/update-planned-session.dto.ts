import { PartialType } from '@nestjs/swagger';
import { CreatePlannedSessionDto } from './create-planned-session.dto';

export class UpdatePlannedSessionDto extends PartialType(
  CreatePlannedSessionDto,
) {}
