import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeaponPropertiesToWeaponsTable1784306660000 implements MigrationInterface {
  name = 'AddWeaponPropertiesToWeaponsTable1784306660000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."weapons_hands_enum" AS ENUM('1', '2')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."weapons_weapon_style_enum" AS ENUM('melee', 'ranged')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."weapons_damage_die_enum" AS ENUM('d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100')`,
    );

    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "nickname" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "weapons" ADD "volume" numeric(4,1)`);
    await queryRunner.query(`ALTER TABLE "weapons" ADD "size_grade_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "hands" "public"."weapons_hands_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "weapon_style" "public"."weapons_weapon_style_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "weapons" ADD "damage_value" integer`);
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "damage_die" "public"."weapons_damage_die_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "weapons" ADD "damage_type_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "magical_damage" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "distance_meters" numeric(4,1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "uses_ammunition" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "reload_actions" integer`,
    );

    await queryRunner.query(
      `ALTER TABLE "weapons" ADD CONSTRAINT "FK_weapons_size_grade_id" FOREIGN KEY ("size_grade_id") REFERENCES "size_grades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD CONSTRAINT "FK_weapons_damage_type_id" FOREIGN KEY ("damage_type_id") REFERENCES "damage_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weapons" DROP CONSTRAINT "FK_weapons_damage_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" DROP CONSTRAINT "FK_weapons_size_grade_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "weapons" DROP COLUMN "reload_actions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" DROP COLUMN "uses_ammunition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" DROP COLUMN "distance_meters"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" DROP COLUMN "magical_damage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" DROP COLUMN "damage_type_id"`,
    );
    await queryRunner.query(`ALTER TABLE "weapons" DROP COLUMN "damage_die"`);
    await queryRunner.query(`ALTER TABLE "weapons" DROP COLUMN "damage_value"`);
    await queryRunner.query(`ALTER TABLE "weapons" DROP COLUMN "weapon_style"`);
    await queryRunner.query(`ALTER TABLE "weapons" DROP COLUMN "hands"`);
    await queryRunner.query(
      `ALTER TABLE "weapons" DROP COLUMN "size_grade_id"`,
    );
    await queryRunner.query(`ALTER TABLE "weapons" DROP COLUMN "volume"`);
    await queryRunner.query(`ALTER TABLE "weapons" DROP COLUMN "nickname"`);

    await queryRunner.query(`DROP TYPE "public"."weapons_damage_die_enum"`);
    await queryRunner.query(`DROP TYPE "public"."weapons_weapon_style_enum"`);
    await queryRunner.query(`DROP TYPE "public"."weapons_hands_enum"`);
  }
}
