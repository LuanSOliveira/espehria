import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enchantment } from './entities/enchantment.entity';
import { EnchantmentsController } from './enchantments.controller';
import { EnchantmentsService } from './enchantments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Enchantment])],
  controllers: [EnchantmentsController],
  providers: [EnchantmentsService],
  exports: [EnchantmentsService],
})
export class EnchantmentsModule {}
