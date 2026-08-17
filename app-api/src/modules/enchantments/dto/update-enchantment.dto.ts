import { PartialType } from '@nestjs/swagger';
import { CreateEnchantmentDto } from './create-enchantment.dto';

export class UpdateEnchantmentDto extends PartialType(CreateEnchantmentDto) {}
