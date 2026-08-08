import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeaponsTable1784306460000 implements MigrationInterface {
  name = 'CreateWeaponsTable1784306460000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "weapons" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" integer, "currency_id" uuid, "private_information" text, CONSTRAINT "PK_weapons_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_weapons_name" ON "weapons" ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD CONSTRAINT "FK_weapons_currency_id" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weapons" DROP CONSTRAINT "FK_weapons_currency_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_weapons_name"`);
    await queryRunner.query(`DROP TABLE "weapons"`);
  }
}
