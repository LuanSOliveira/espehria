import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const raceFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  categoryId: z.string().min(1, 'Selecione a categoria'),
  referenceImageUrl: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  description: z.string(),
  privateInformation: z.string(),
  tagIds: z.array(z.string()).optional(),
  characteristicIds: z.array(z.string()).optional(),
  talentIds: z.array(z.string()).optional(),
});

export type RaceFormData = z.infer<typeof raceFormSchema>;

export const raceFormResolver = zodResolver(raceFormSchema);

export const raceFormDefaultValues: RaceFormData = {
  name: '',
  categoryId: '',
  referenceImageUrl: '',
  description: '',
  privateInformation: '',
  tagIds: [],
  characteristicIds: [],
  talentIds: [],
};
