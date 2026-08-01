import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCurrenciesTable1784306130000 implements MigrationInterface {
  name = 'SeedCurrenciesTable1784306130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "currencies" ("abbreviation", "name") VALUES ('PC', 'Cobre'), ('PP', 'Prata'), ('PO', 'Ouro'), ('PL', 'Platina')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "currencies" WHERE "abbreviation" IN ('PC', 'PP', 'PO', 'PL')`,
    );
  }
}
