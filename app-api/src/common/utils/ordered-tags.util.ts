import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { Tag } from '../../modules/tags/entities/tag.entity';

// Formato mínimo de uma entidade de junção "<Owner>Tag" (ex.: AmmunitionTag,
// TalentTag): id/order próprios da linha de junção mais a relação `tag`. A
// relação com o dono (ex.: `ammunition`, `talent`) é dinâmica e identificada
// por `ownerRelationName` em cada função abaixo.
export interface TagJunctionRow {
  id: string;
  order: number;
  tag: Tag;
}

// Busca, em lote, as linhas de junção de vários donos e agrupa as tags já
// ordenadas (order ASC, id ASC — desempate estável para linhas legadas com a
// mesma `order`) em um Map<ownerId, Tag[]>. Usado tanto no detalhe (lote de 1
// id) quanto na listagem paginada (lote de N ids) dos 24 módulos com tags.
export async function loadOrderedTagsMap<J extends TagJunctionRow>(
  junctionRepository: Repository<J>,
  ownerIds: string[],
  ownerRelationName: string,
): Promise<Map<string, Tag[]>> {
  const tagsByOwnerId = new Map<string, Tag[]>();
  if (ownerIds.length === 0) {
    return tagsByOwnerId;
  }

  const rows = await junctionRepository.find({
    where: {
      [ownerRelationName]: { id: In(ownerIds) },
    } as FindOptionsWhere<J>,
    relations: {
      [ownerRelationName]: true,
      tag: true,
    } as FindOptionsRelations<J>,
    order: {
      order: 'ASC',
      id: 'ASC',
    } as FindOptionsOrder<J>,
  });

  for (const row of rows) {
    const owner = row[ownerRelationName as keyof J] as unknown as {
      id: string;
    };
    const tags = tagsByOwnerId.get(owner.id) ?? [];
    tags.push(row.tag);
    tagsByOwnerId.set(owner.id, tags);
  }

  return tagsByOwnerId;
}

// Atalho de `loadOrderedTagsMap` para um único dono (fluxo de detalhe).
export async function loadOrderedTagsForOwner<J extends TagJunctionRow>(
  junctionRepository: Repository<J>,
  ownerId: string,
  ownerRelationName: string,
): Promise<Tag[]> {
  const tagsByOwnerId = await loadOrderedTagsMap(
    junctionRepository,
    [ownerId],
    ownerRelationName,
  );
  return tagsByOwnerId.get(ownerId) ?? [];
}

function buildOrderedTagJunctions<J extends object>(
  junctionRepository: Repository<J>,
  ownerRelationName: string,
  owner: { id: string },
  tags: Tag[],
): J[] {
  return tags.map((tag, index) =>
    junctionRepository.create({
      [ownerRelationName]: owner,
      tag,
      order: index,
    } as object as J),
  );
}

// Grava as linhas de junção ordenadas (order = índice no array já resolvido)
// para um dono recém-criado. Assume que não existem linhas prévias para esse
// dono (uso em `create`).
export async function createOrderedTagJunctions<J extends { id: string }>(
  junctionRepository: Repository<J>,
  ownerRelationName: string,
  owner: { id: string },
  tags: Tag[],
): Promise<void> {
  if (tags.length === 0) {
    return;
  }
  const junctions = buildOrderedTagJunctions(
    junctionRepository,
    ownerRelationName,
    owner,
    tags,
  );
  await junctionRepository.save(junctions);
}

// Apaga todas as linhas de junção existentes de um dono e recria do zero na
// ordem resolvida (uso em `update`, quando `dto.tagIds !== undefined`).
export async function replaceOrderedTagJunctions<J extends { id: string }>(
  junctionRepository: Repository<J>,
  ownerRelationName: string,
  owner: { id: string },
  tags: Tag[],
): Promise<void> {
  await junctionRepository.delete({
    [ownerRelationName]: { id: owner.id },
  } as FindOptionsWhere<J>);

  await createOrderedTagJunctions(
    junctionRepository,
    ownerRelationName,
    owner,
    tags,
  );
}
