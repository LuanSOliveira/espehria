import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTalentsTable1784305910000 implements MigrationInterface {
  name = 'CreateTalentsTable1784305910000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "talents" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text, CONSTRAINT "PK_talents_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_talents_name" ON "talents" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_talents_name"`);
    await queryRunner.query(`DROP TABLE "talents"`);
  }
}
