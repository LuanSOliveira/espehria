import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Technique } from './entities/technique.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TechniquesController } from './techniques.controller';
import { TechniquesService } from './techniques.service';

@Module({
  imports: [TypeOrmModule.forFeature([Technique, Tag])],
  controllers: [TechniquesController],
  providers: [TechniquesService],
  exports: [TechniquesService],
})
export class TechniquesModule {}
