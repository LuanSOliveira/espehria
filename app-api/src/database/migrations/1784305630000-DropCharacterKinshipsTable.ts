import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCharacterKinshipsTable1784305630000
  implements MigrationInterface
{
  name = 'DropCharacterKinshipsTable1784305630000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "character_kinships" DROP CONSTRAINT "FK_character_kinships_relative_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "character_kinships" DROP CONSTRAINT "FK_character_kinships_character_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_character_kinships_relative_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_character_kinships_character_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_character_kinships_character_id_relative_id"`,
    );
    await queryRunner.query(`DROP TABLE "character_kinships"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "character_kinships" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "kinship" character varying NOT NULL, "character_id" uuid NOT NULL, "relative_id" uuid NOT NULL, CONSTRAINT "PK_character_kinships_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_character_kinships_character_id_relative_id" ON "character_kinships" ("character_id", "relative_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_character_kinships_character_id" ON "character_kinships" ("character_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_character_kinships_relative_id" ON "character_kinships" ("relative_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "character_kinships" ADD CONSTRAINT "FK_character_kinships_character_id" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "character_kinships" ADD CONSTRAINT "FK_character_kinships_relative_id" FOREIGN KEY ("relative_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
