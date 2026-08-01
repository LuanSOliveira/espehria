import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdditionalAbilityToEntityLinksLinkTypeEnum1784306150000
  implements MigrationInterface
{
  name = 'AddAdditionalAbilityToEntityLinksLinkTypeEnum1784306150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."entity_links_link_type_enum" ADD VALUE 'additional_ability'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Destrutivo: remove qualquer linha de "entity_links" que já use o valor
    // 'additional_ability' (Habilidades Adicionais), pois o Postgres não
    // permite ALTER TYPE ... DROP VALUE — o tipo precisa ser recriado sem o
    // valor novo, o que exige que a coluna não contenha mais esse valor.
    await queryRunner.query(
      `DELETE FROM "entity_links" WHERE "link_type" = 'additional_ability'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."entity_links_link_type_enum" RENAME TO "entity_links_link_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."entity_links_link_type_enum" AS ENUM('improved_from', 'requirement')`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ALTER COLUMN "link_type" TYPE "public"."entity_links_link_type_enum" USING "link_type"::text::"public"."entity_links_link_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."entity_links_link_type_enum_old"`,
    );
  }
}
