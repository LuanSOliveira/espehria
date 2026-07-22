import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationsTable1784305400000 implements MigrationInterface {
  name = 'CreateLocationsTable1784305400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "type" character varying, "reference_image_url" character varying, "description" text, CONSTRAINT "PK_locations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_locations_name" ON "locations" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_locations_name"`);
    await queryRunner.query(`DROP TABLE "locations"`);
  }
}
