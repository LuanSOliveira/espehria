import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharacteristicsTable1784306070000
  implements MigrationInterface
{
  name = 'CreateCharacteristicsTable1784306070000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "characteristics" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text, CONSTRAINT "PK_characteristics_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_characteristics_name" ON "characteristics" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_characteristics_name"`);
    await queryRunner.query(`DROP TABLE "characteristics"`);
  }
}
