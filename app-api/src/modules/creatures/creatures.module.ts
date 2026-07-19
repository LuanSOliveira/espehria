import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Creature } from './entities/creature.entity';
import { CreatureCategory } from './entities/creature-category.entity';
import { CreaturesController } from './creatures.controller';
import { CreaturesService } from './creatures.service';

@Module({
  imports: [TypeOrmModule.forFeature([Creature, CreatureCategory])],
  controllers: [CreaturesController],
  providers: [CreaturesService],
  exports: [CreaturesService],
})
export class CreaturesModule {}
