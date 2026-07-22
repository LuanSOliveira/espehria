import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreatureTagsTable1784305380000
  implements MigrationInterface
{
  name = 'CreateCreatureTagsTable1784305380000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "creature_tags" ("creature_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_creature_tags" PRIMARY KEY ("creature_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_creature_tags_creature_id" ON "creature_tags" ("creature_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_creature_tags_tag_id" ON "creature_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "creature_tags" ADD CONSTRAINT "FK_creature_tags_creature_id" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creature_tags" ADD CONSTRAINT "FK_creature_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creature_tags" DROP CONSTRAINT "FK_creature_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creature_tags" DROP CONSTRAINT "FK_creature_tags_creature_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_creature_tags_tag_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_creature_tags_creature_id"`,
    );
    await queryRunner.query(`DROP TABLE "creature_tags"`);
  }
}
