import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeaponTagsTable1784306470000 implements MigrationInterface {
  name = 'CreateWeaponTagsTable1784306470000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "weapon_tags" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT 0, "weapon_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_weapon_tags_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_weapon_tags_weapon_id_tag_id" ON "weapon_tags" ("weapon_id", "tag_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_weapon_tags_weapon_id" ON "weapon_tags" ("weapon_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_weapon_tags_tag_id" ON "weapon_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_tags" ADD CONSTRAINT "FK_weapon_tags_weapon_id" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_tags" ADD CONSTRAINT "FK_weapon_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weapon_tags" DROP CONSTRAINT "FK_weapon_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_tags" DROP CONSTRAINT "FK_weapon_tags_weapon_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_weapon_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_weapon_tags_weapon_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_weapon_tags_weapon_id_tag_id"`,
    );
    await queryRunner.query(`DROP TABLE "weapon_tags"`);
  }
}
