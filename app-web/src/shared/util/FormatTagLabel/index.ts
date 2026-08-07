import { ITag } from '@/shared/interfaces';

export const formatTagLabel = (tag: ITag): string =>
  tag.type ? `${tag.name} (${tag.type})` : tag.name;
