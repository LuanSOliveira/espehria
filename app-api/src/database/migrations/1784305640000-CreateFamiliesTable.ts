import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFamiliesTable1784305640000 implements MigrationInterface {
  name = 'CreateFamiliesTable1784305640000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."families_classification_enum" AS ENUM('royalty', 'nobility', 'commoner')`,
    );
    await queryRunner.query(
      `CREATE TABLE "families" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "classification" "public"."families_classification_enum" NOT NULL, CONSTRAINT "PK_families_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "families"`);
    await queryRunner.query(
      `DROP TYPE "public"."families_classification_enum"`,
    );
  }
}
