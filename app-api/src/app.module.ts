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
import { EquipmentModule } from './modules/equipment/equipment.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ConsumablesModule } from './modules/consumables/consumables.module';
import { AmmunitionModule } from './modules/ammunition/ammunition.module';
import { RulesModule } from './modules/rules/rules.module';

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
    EquipmentModule,
    MaterialsModule,
    ConsumablesModule,
    AmmunitionModule,
    RulesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
