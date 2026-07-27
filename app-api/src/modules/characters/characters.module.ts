import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './entities/character.entity';
import { CharacterKinship } from './entities/character-kinship.entity';
import { Race } from '../races/entities/race.entity';
import { Tag } from '../tags/entities/tag.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Character,
      CharacterKinship,
      Race,
      Tag,
      OrganizationMember,
    ]),
  ],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
