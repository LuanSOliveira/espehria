import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const divinityFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  categoryId: z.string().min(1, 'Selecione a categoria'),
  referenceImage: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  description: z.string(),
  tagIds: z.array(z.string()).optional(),
  titles: z.string(),
  alignment: z.string(),
  domainSphere: z.string(),
  primaryElement: z.string(),
  sacredSymbol: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  sacredAnimal: z.string(),
  sacredColor: z.string(),
  personality: z.string(),
  divineDomains: z.string(),
  powers: z.string(),
  worldInfluence: z.string(),
  divineAppearance: z.string(),
  avatars: z.string(),
  church: z.string(),
  cult: z.string(),
  blessings: z.string(),
  curses: z.string(),
  legends: z.string(),
  commandments: z.string(),
  oaths: z.string(),
  curiosities: z.string(),
  privateInformation: z.string(),
});

export type DivinityFormData = z.infer<typeof divinityFormSchema>;

export const divinityFormResolver = zodResolver(divinityFormSchema);

export const divinityFormDefaultValues: DivinityFormData = {
  name: '',
  categoryId: '',
  referenceImage: '',
  description: '',
  tagIds: [],
  titles: '',
  alignment: '',
  domainSphere: '',
  primaryElement: '',
  sacredSymbol: '',
  sacredAnimal: '',
  sacredColor: '',
  personality: '',
  divineDomains: '',
  powers: '',
  worldInfluence: '',
  divineAppearance: '',
  avatars: '',
  church: '',
  cult: '',
  blessings: '',
  curses: '',
  legends: '',
  commandments: '',
  oaths: '',
  curiosities: '',
  privateInformation: '',
};
