import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArmorTraitsTable1784306710000
  implements MigrationInterface
{
  name = 'CreateArmorTraitsTable1784306710000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "armor_traits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT 0, "armor_id" uuid NOT NULL, "trait_id" uuid NOT NULL, CONSTRAINT "PK_armor_traits_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_armor_traits_armor_id_trait_id" ON "armor_traits" ("armor_id", "trait_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_armor_traits_armor_id" ON "armor_traits" ("armor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_armor_traits_trait_id" ON "armor_traits" ("trait_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "armor_traits" ADD CONSTRAINT "FK_armor_traits_armor_id" FOREIGN KEY ("armor_id") REFERENCES "armors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "armor_traits" ADD CONSTRAINT "FK_armor_traits_trait_id" FOREIGN KEY ("trait_id") REFERENCES "traits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "armor_traits" DROP CONSTRAINT "FK_armor_traits_trait_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "armor_traits" DROP CONSTRAINT "FK_armor_traits_armor_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_armor_traits_trait_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_armor_traits_armor_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_armor_traits_armor_id_trait_id"`,
    );
    await queryRunner.query(`DROP TABLE "armor_traits"`);
  }
}
