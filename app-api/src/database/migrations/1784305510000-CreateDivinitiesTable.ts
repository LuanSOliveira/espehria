import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDivinitiesTable1784305510000 implements MigrationInterface {
  name = 'CreateDivinitiesTable1784305510000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "divinities" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, CONSTRAINT "PK_divinities_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_divinities_name" ON "divinities" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_divinities_name"`);
    await queryRunner.query(`DROP TABLE "divinities"`);
  }
}
