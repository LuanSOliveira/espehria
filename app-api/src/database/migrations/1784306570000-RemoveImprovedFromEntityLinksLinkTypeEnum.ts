import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveImprovedFromEntityLinksLinkTypeEnum1784306570000
  implements MigrationInterface
{
  name = 'RemoveImprovedFromEntityLinksLinkTypeEnum1784306570000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres não permite ALTER TYPE ... DROP VALUE — é preciso remover
    // primeiro qualquer linha que ainda use 'improved_from' (senão a
    // conversão de tipo abaixo falha), depois recriar o enum sem esse valor.
    await queryRunner.query(
      `DELETE FROM "entity_links" WHERE "link_type" = 'improved_from'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."entity_links_link_type_enum" RENAME TO "entity_links_link_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."entity_links_link_type_enum" AS ENUM('requirement', 'additional_ability')`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ALTER COLUMN "link_type" TYPE "public"."entity_links_link_type_enum" USING "link_type"::text::"public"."entity_links_link_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."entity_links_link_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recria o valor 'improved_from' no enum, mas NÃO restaura as linhas
    // apagadas pelo DELETE do up() — essa perda de dados é irreversível,
    // mesmo padrão já aceito no down() de
    // 1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts.
    await queryRunner.query(
      `ALTER TYPE "public"."entity_links_link_type_enum" RENAME TO "entity_links_link_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."entity_links_link_type_enum" AS ENUM('improved_from', 'requirement', 'additional_ability')`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ALTER COLUMN "link_type" TYPE "public"."entity_links_link_type_enum" USING "link_type"::text::"public"."entity_links_link_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."entity_links_link_type_enum_old"`,
    );
  }
}
