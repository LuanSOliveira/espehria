import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsumablesTable1784305750000
  implements MigrationInterface
{
  name = 'CreateConsumablesTable1784305750000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "consumables" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" character varying, "private_information" text, CONSTRAINT "PK_consumables_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_consumables_name" ON "consumables" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_consumables_name"`);
    await queryRunner.query(`DROP TABLE "consumables"`);
  }
}
