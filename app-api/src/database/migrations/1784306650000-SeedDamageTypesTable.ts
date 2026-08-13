import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDamageTypesTable1784306650000 implements MigrationInterface {
  name = 'SeedDamageTypesTable1784306650000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "damage_types" ("name") VALUES ('Contundente'), ('Perfurante'), ('Cortante')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "damage_types" WHERE "name" IN ('Contundente', 'Perfurante', 'Cortante')`,
    );
  }
}
