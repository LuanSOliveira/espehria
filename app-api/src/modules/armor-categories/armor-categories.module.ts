import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArmorCategory } from './entities/armor-category.entity';
import { ArmorCategoriesController } from './armor-categories.controller';
import { ArmorCategoriesService } from './armor-categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([ArmorCategory])],
  controllers: [ArmorCategoriesController],
  providers: [ArmorCategoriesService],
  exports: [ArmorCategoriesService],
})
export class ArmorCategoriesModule {}
