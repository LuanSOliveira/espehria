import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddElementalCreatureCategory1784305390000
  implements MigrationInterface
{
  name = 'AddElementalCreatureCategory1784305390000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "creature_categories" ("name") VALUES ('Elemental')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "creature_categories" WHERE "name" = 'Elemental'`,
    );
  }
}
