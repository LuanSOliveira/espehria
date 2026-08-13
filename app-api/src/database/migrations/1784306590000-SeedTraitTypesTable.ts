import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTraitTypesTable1784306590000 implements MigrationInterface {
  name = 'SeedTraitTypesTable1784306590000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "trait_types" ("name") VALUES ('Arma'), ('Armadura')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "trait_types" WHERE "name" IN ('Arma', 'Armadura')`,
    );
  }
}
