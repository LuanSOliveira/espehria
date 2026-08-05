import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Era } from './entities/era.entity';
import { EraTag } from './entities/era-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ErasController } from './eras.controller';
import { ErasService } from './eras.service';

@Module({
  imports: [TypeOrmModule.forFeature([Era, EraTag, Tag])],
  controllers: [ErasController],
  providers: [ErasService],
  exports: [ErasService],
})
export class ErasModule {}
