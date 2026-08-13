import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTraitsTable1784306600000 implements MigrationInterface {
  name = 'CreateTraitsTable1784306600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "traits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text, "trait_type_id" uuid, CONSTRAINT "PK_traits_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_traits_name" ON "traits" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_traits_trait_type_id" ON "traits" ("trait_type_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "traits" ADD CONSTRAINT "FK_traits_trait_type_id" FOREIGN KEY ("trait_type_id") REFERENCES "trait_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "traits" DROP CONSTRAINT "FK_traits_trait_type_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_traits_trait_type_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_traits_name"`);
    await queryRunner.query(`DROP TABLE "traits"`);
  }
}
