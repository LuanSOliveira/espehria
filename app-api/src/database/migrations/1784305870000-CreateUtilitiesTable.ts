import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUtilitiesTable1784305870000 implements MigrationInterface {
  name = 'CreateUtilitiesTable1784305870000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "utilities" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" character varying, "private_information" text, CONSTRAINT "PK_utilities_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_utilities_name" ON "utilities" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_utilities_name"`);
    await queryRunner.query(`DROP TABLE "utilities"`);
  }
}
