import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePriceAndAddCurrencyToItemTables1784306140000
  implements MigrationInterface
{
  name = 'ChangePriceAndAddCurrencyToItemTables1784306140000';

  private readonly tables = [
    'equipment',
    'materials',
    'consumables',
    'ammunition',
    'utilities',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "price" TYPE integer USING (CASE WHEN "price" ~ '^[0-9]+$' THEN "price"::integer ELSE NULL END)`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" ADD "currency_id" uuid`);
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_currency_id" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "FK_${table}_currency_id"`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "currency_id"`);
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "price" TYPE character varying USING "price"::character varying`,
      );
    }
  }
}
