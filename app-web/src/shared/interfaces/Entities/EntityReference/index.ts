import { ITag } from '../Tag';

export interface IEntityReference {
  id: string;
  name: string;
  entityType: string;
  tags: ITag[];
}
