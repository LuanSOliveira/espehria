import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTechniquesTable1784305930000 implements MigrationInterface {
  name = 'CreateTechniquesTable1784305930000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "techniques" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, CONSTRAINT "PK_techniques_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_techniques_name" ON "techniques" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_techniques_name"`);
    await queryRunner.query(`DROP TABLE "techniques"`);
  }
}
