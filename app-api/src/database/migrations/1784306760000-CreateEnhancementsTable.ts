import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnhancementsTable1784306760000 implements MigrationInterface {
  name = 'CreateEnhancementsTable1784306760000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."enhancements_type_enum" AS ENUM('weapon', 'armor', 'shield', 'accessory')`,
    );
    await queryRunner.query(
      `CREATE TABLE "enhancements" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "type" "public"."enhancements_type_enum", "effect" text, CONSTRAINT "PK_enhancements_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_enhancements_name" ON "enhancements" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_enhancements_name"`);
    await queryRunner.query(`DROP TABLE "enhancements"`);
    await queryRunner.query(`DROP TYPE "public"."enhancements_type_enum"`);
  }
}
