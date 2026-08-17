import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeaponExtraDamagesTable1784306740000 implements MigrationInterface {
  name = 'CreateWeaponExtraDamagesTable1784306740000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."weapon_extra_damages_damage_die_enum" AS ENUM('d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100')`,
    );
    await queryRunner.query(
      `CREATE TABLE "weapon_extra_damages" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "damage_value" integer, "damage_die" "public"."weapon_extra_damages_damage_die_enum", "damage_type_id" uuid, "magical_damage" boolean NOT NULL DEFAULT false, "distance_meters" numeric(4,1), "reload_actions" integer, "uses_ammunition" boolean NOT NULL DEFAULT false, "order" integer NOT NULL, "weapon_id" uuid NOT NULL, CONSTRAINT "PK_weapon_extra_damages_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_weapon_extra_damages_weapon_id" ON "weapon_extra_damages" ("weapon_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_extra_damages" ADD CONSTRAINT "FK_weapon_extra_damages_weapon_id" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_extra_damages" ADD CONSTRAINT "FK_weapon_extra_damages_damage_type_id" FOREIGN KEY ("damage_type_id") REFERENCES "damage_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weapon_extra_damages" DROP CONSTRAINT "FK_weapon_extra_damages_damage_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapon_extra_damages" DROP CONSTRAINT "FK_weapon_extra_damages_weapon_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_weapon_extra_damages_weapon_id"`,
    );
    await queryRunner.query(`DROP TABLE "weapon_extra_damages"`);
    await queryRunner.query(
      `DROP TYPE "public"."weapon_extra_damages_damage_die_enum"`,
    );
  }
}
