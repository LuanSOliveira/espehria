import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './entities/character.entity';
import { CharacterTag } from './entities/character-tag.entity';
import { Race } from '../races/entities/race.entity';
import { RaceTag } from '../races/entities/race-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Family } from '../families/entities/family.entity';
import { FamilyMember } from '../families/entities/family-member.entity';
import { FamilyRelationship } from '../families/entities/family-relationship.entity';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Character,
      CharacterTag,
      Race,
      RaceTag,
      Tag,
      OrganizationMember,
      Family,
      FamilyMember,
      FamilyRelationship,
    ]),
  ],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
