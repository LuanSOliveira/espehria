import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFamilyRelationshipsTable1784305670000
  implements MigrationInterface
{
  name = 'CreateFamilyRelationshipsTable1784305670000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."family_relationships_type_enum" AS ENUM('parent', 'spouse')`,
    );
    await queryRunner.query(
      `CREATE TABLE "family_relationships" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."family_relationships_type_enum" NOT NULL, "family_id" uuid NOT NULL, "source_character_id" uuid NOT NULL, "target_character_id" uuid NOT NULL, CONSTRAINT "PK_family_relationships_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_family_relationships_family_source_target" ON "family_relationships" ("family_id", "source_character_id", "target_character_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_family_relationships_family_id" ON "family_relationships" ("family_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_family_relationships_source_character_id" ON "family_relationships" ("source_character_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_family_relationships_target_character_id" ON "family_relationships" ("target_character_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_relationships" ADD CONSTRAINT "FK_family_relationships_family_id" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_relationships" ADD CONSTRAINT "FK_family_relationships_source_character_id" FOREIGN KEY ("source_character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_relationships" ADD CONSTRAINT "FK_family_relationships_target_character_id" FOREIGN KEY ("target_character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "family_relationships" DROP CONSTRAINT "FK_family_relationships_target_character_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_relationships" DROP CONSTRAINT "FK_family_relationships_source_character_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_relationships" DROP CONSTRAINT "FK_family_relationships_family_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_family_relationships_target_character_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_family_relationships_source_character_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_family_relationships_family_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_family_relationships_family_source_target"`,
    );
    await queryRunner.query(`DROP TABLE "family_relationships"`);
    await queryRunner.query(
      `DROP TYPE "public"."family_relationships_type_enum"`,
    );
  }
}
