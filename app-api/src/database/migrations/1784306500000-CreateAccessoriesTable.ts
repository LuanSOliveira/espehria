import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccessoriesTable1784306500000 implements MigrationInterface {
  name = 'CreateAccessoriesTable1784306500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "accessories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" integer, "currency_id" uuid, "private_information" text, CONSTRAINT "PK_accessories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_accessories_name" ON "accessories" ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessories" ADD CONSTRAINT "FK_accessories_currency_id" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accessories" DROP CONSTRAINT "FK_accessories_currency_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_accessories_name"`);
    await queryRunner.query(`DROP TABLE "accessories"`);
  }
}
