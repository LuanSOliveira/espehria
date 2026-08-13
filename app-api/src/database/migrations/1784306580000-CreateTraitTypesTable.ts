import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTraitTypesTable1784306580000 implements MigrationInterface {
  name = 'CreateTraitTypesTable1784306580000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "trait_types" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_trait_types_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_trait_types_name" ON "trait_types" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_trait_types_name"`);
    await queryRunner.query(`DROP TABLE "trait_types"`);
  }
}
