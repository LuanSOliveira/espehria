import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFamilyMembersTable1784305660000
  implements MigrationInterface
{
  name = 'CreateFamilyMembersTable1784305660000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "family_members" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "position_x" double precision NOT NULL, "position_y" double precision NOT NULL, "family_id" uuid NOT NULL, "character_id" uuid NOT NULL, CONSTRAINT "PK_family_members_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_family_members_family_id_character_id" ON "family_members" ("family_id", "character_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_family_members_family_id" ON "family_members" ("family_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_family_members_character_id" ON "family_members" ("character_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD CONSTRAINT "FK_family_members_family_id" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD CONSTRAINT "FK_family_members_character_id" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP CONSTRAINT "FK_family_members_character_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP CONSTRAINT "FK_family_members_family_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_family_members_character_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_family_members_family_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_family_members_family_id_character_id"`,
    );
    await queryRunner.query(`DROP TABLE "family_members"`);
  }
}
