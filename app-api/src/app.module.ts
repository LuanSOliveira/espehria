import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration, { AppConfig } from './config/configuration';
import { validate } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CreaturesModule } from './modules/creatures/creatures.module';
import { SearchModule } from './modules/search/search.module';
import { TagsModule } from './modules/tags/tags.module';
import { LocationsModule } from './modules/locations/locations.module';
import { RacesModule } from './modules/races/races.module';
import { ErasModule } from './modules/eras/eras.module';
import { EventsModule } from './modules/events/events.module';
import { DivinitiesModule } from './modules/divinities/divinities.module';
import { CharactersModule } from './modules/characters/characters.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { FamiliesModule } from './modules/families/families.module';
import { WeaponsModule } from './modules/weapons/weapons.module';
import { ArmorsModule } from './modules/armors/armors.module';
import { AccessoriesModule } from './modules/accessories/accessories.module';
import { ShieldsModule } from './modules/shields/shields.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ConsumablesModule } from './modules/consumables/consumables.module';
import { AmmunitionModule } from './modules/ammunition/ammunition.module';
import { UtilitiesModule } from './modules/utilities/utilities.module';
import { RulesModule } from './modules/rules/rules.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ConditionsModule } from './modules/conditions/conditions.module';
import { TrainingsModule } from './modules/trainings/trainings.module';
import { TalentsModule } from './modules/talents/talents.module';
import { CharacteristicsModule } from './modules/characteristics/characteristics.module';
import { TechniquesModule } from './modules/techniques/techniques.module';
import { SpellsModule } from './modules/spells/spells.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { PlannedSessionsModule } from './modules/planned-sessions/planned-sessions.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { SheetsModule } from './modules/sheets/sheets.module';
import { ImprovementFlawTypesModule } from './modules/improvement-flaw-types/improvement-flaw-types.module';
import { ImprovementFlawPropertiesModule } from './modules/improvement-flaw-properties/improvement-flaw-properties.module';
import { BiographiesModule } from './modules/biographies/biographies.module';
import { ProficiencyPropertiesModule } from './modules/proficiency-properties/proficiency-properties.module';
import { ProficiencyGradationsModule } from './modules/proficiency-gradations/proficiency-gradations.module';
import { TraitTypesModule } from './modules/trait-types/trait-types.module';
import { SizeGradesModule } from './modules/size-grades/size-grades.module';
import { DamageTypesModule } from './modules/damage-types/damage-types.module';
import { TraitsModule } from './modules/traits/traits.module';
import { ArmorCategoriesModule } from './modules/armor-categories/armor-categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        type: 'postgres',
        host: configService.get('database.host', { infer: true }),
        port: configService.get('database.port', { infer: true }),
        username: configService.get('database.username', { infer: true }),
        password: configService.get('database.password', { infer: true }),
        database: configService.get('database.name', { infer: true }),
        synchronize: configService.get('database.synchronize', {
          infer: true,
        }),
        uuidExtension: 'pgcrypto',
        autoLoadEntities: true,
        migrations: [join(__dirname, 'database', 'migrations', '*{.ts,.js}')],
        migrationsTableName: 'migrations',
      }),
    }),
    UsersModule,
    AuthModule,
    CreaturesModule,
    SearchModule,
    TagsModule,
    LocationsModule,
    RacesModule,
    ErasModule,
    EventsModule,
    DivinitiesModule,
    CharactersModule,
    OrganizationsModule,
    FamiliesModule,
    WeaponsModule,
    ArmorsModule,
    AccessoriesModule,
    ShieldsModule,
    MaterialsModule,
    ConsumablesModule,
    AmmunitionModule,
    UtilitiesModule,
    RulesModule,
    SkillsModule,
    ConditionsModule,
    TrainingsModule,
    TalentsModule,
    CharacteristicsModule,
    TechniquesModule,
    SpellsModule,
    CampaignsModule,
    PlannedSessionsModule,
    AttributesModule,
    CurrenciesModule,
    SheetsModule,
    ImprovementFlawTypesModule,
    ImprovementFlawPropertiesModule,
    BiographiesModule,
    ProficiencyPropertiesModule,
    ProficiencyGradationsModule,
    TraitTypesModule,
    SizeGradesModule,
    DamageTypesModule,
    TraitsModule,
    ArmorCategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
