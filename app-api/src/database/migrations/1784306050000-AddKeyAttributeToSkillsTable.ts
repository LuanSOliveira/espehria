import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKeyAttributeToSkillsTable1784306050000
  implements MigrationInterface
{
  name = 'AddKeyAttributeToSkillsTable1784306050000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "skills" ADD "key_attribute_id" uuid`);
    await queryRunner.query(
      `UPDATE "skills" SET "key_attribute_id" = (SELECT "id" FROM "attributes" WHERE "name" = 'Força') WHERE "key_attribute_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" ALTER COLUMN "key_attribute_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" ADD CONSTRAINT "FK_skills_key_attribute_id" FOREIGN KEY ("key_attribute_id") REFERENCES "attributes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "skills" DROP CONSTRAINT "FK_skills_key_attribute_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" DROP COLUMN "key_attribute_id"`,
    );
  }
}
