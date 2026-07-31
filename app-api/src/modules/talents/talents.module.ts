import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Talent } from './entities/talent.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TalentsController } from './talents.controller';
import { TalentsService } from './talents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Talent, Tag])],
  controllers: [TalentsController],
  providers: [TalentsService],
  exports: [TalentsService],
})
export class TalentsModule {}
