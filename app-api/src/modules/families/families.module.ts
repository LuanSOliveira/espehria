import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { FamilyRelationship } from './entities/family-relationship.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Character } from '../characters/entities/character.entity';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Family,
      FamilyMember,
      FamilyRelationship,
      Tag,
      Character,
    ]),
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
