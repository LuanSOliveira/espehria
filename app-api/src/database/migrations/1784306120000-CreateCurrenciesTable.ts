import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCurrenciesTable1784306120000 implements MigrationInterface {
  name = 'CreateCurrenciesTable1784306120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "currencies" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "abbreviation" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_currencies_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_currencies_abbreviation" ON "currencies" ("abbreviation")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_currencies_abbreviation"`,
    );
    await queryRunner.query(`DROP TABLE "currencies"`);
  }
}
