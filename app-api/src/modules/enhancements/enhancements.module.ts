import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enhancement } from './entities/enhancement.entity';
import { EnhancementsController } from './enhancements.controller';
import { EnhancementsService } from './enhancements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Enhancement])],
  controllers: [EnhancementsController],
  providers: [EnhancementsService],
  exports: [EnhancementsService],
})
export class EnhancementsModule {}
