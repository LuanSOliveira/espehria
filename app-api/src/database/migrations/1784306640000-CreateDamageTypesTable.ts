import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDamageTypesTable1784306640000 implements MigrationInterface {
  name = 'CreateDamageTypesTable1784306640000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "damage_types" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_damage_types_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_damage_types_name" ON "damage_types" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_damage_types_name"`);
    await queryRunner.query(`DROP TABLE "damage_types"`);
  }
}
