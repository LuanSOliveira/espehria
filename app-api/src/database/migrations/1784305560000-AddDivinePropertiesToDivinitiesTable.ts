import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDivinePropertiesToDivinitiesTable1784305560000
  implements MigrationInterface
{
  name = 'AddDivinePropertiesToDivinitiesTable1784305560000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "titles" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "alignment" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "domain_sphere" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "primary_element" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "sacred_symbol" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "sacred_animal" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "sacred_color" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" ADD "personality" text`);
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "divine_domains" text`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" ADD "powers" text`);
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "world_influence" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "divine_appearance" text`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" ADD "avatars" text`);
    await queryRunner.query(`ALTER TABLE "divinities" ADD "church" text`);
    await queryRunner.query(`ALTER TABLE "divinities" ADD "cult" text`);
    await queryRunner.query(`ALTER TABLE "divinities" ADD "blessings" text`);
    await queryRunner.query(`ALTER TABLE "divinities" ADD "curses" text`);
    await queryRunner.query(`ALTER TABLE "divinities" ADD "legends" text`);
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "commandments" text`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" ADD "oaths" text`);
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD "curiosities" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "curiosities"`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" DROP COLUMN "oaths"`);
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "commandments"`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" DROP COLUMN "legends"`);
    await queryRunner.query(`ALTER TABLE "divinities" DROP COLUMN "curses"`);
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "blessings"`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" DROP COLUMN "cult"`);
    await queryRunner.query(`ALTER TABLE "divinities" DROP COLUMN "church"`);
    await queryRunner.query(`ALTER TABLE "divinities" DROP COLUMN "avatars"`);
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "divine_appearance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "world_influence"`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" DROP COLUMN "powers"`);
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "divine_domains"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "personality"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "sacred_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "sacred_animal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "sacred_symbol"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "primary_element"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "domain_sphere"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "alignment"`,
    );
    await queryRunner.query(`ALTER TABLE "divinities" DROP COLUMN "titles"`);
  }
}
