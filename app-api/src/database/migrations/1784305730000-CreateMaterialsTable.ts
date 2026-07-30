import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaterialsTable1784305730000 implements MigrationInterface {
  name = 'CreateMaterialsTable1784305730000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "materials" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" character varying, "private_information" text, CONSTRAINT "PK_materials_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_materials_name" ON "materials" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_materials_name"`);
    await queryRunner.query(`DROP TABLE "materials"`);
  }
}
