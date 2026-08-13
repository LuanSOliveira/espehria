import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeaponTraitsTable1784306670000
  implements MigrationInterface
{
  name = 'CreateWeaponTraitsTable1784306670000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "weapon_traits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT 0, "weapon_id" uuid NOT NULL, "trait_id" uuid NOT NULL, CONSTRAINT "PK_weapon_traits_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_weapon_traits_weapon_id_trait_id" ON "weapon_traits" ("weapon_id", "trait_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_weapon_traits_weapon_id" ON "weapon_traits" ("weapon_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_weapon_traits_trait_id" ON "weapon_traits" ("trait_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_traits" ADD CONSTRAINT "FK_weapon_traits_weapon_id" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_traits" ADD CONSTRAINT "FK_weapon_traits_trait_id" FOREIGN KEY ("trait_id") REFERENCES "traits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weapon_traits" DROP CONSTRAINT "FK_weapon_traits_trait_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_traits" DROP CONSTRAINT "FK_weapon_traits_weapon_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_weapon_traits_trait_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_weapon_traits_weapon_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_weapon_traits_weapon_id_trait_id"`,
    );
    await queryRunner.query(`DROP TABLE "weapon_traits"`);
  }
}
