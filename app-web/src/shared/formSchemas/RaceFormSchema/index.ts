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
  hitPoints: z
    .string()
    .min(1, 'Informe os pontos de vida')
    .refine((value) => /^\d+$/.test(value), 'Informe um número inteiro')
    .refine(
      (value) => Number(value) >= 1,
      'Os pontos de vida devem ser no mínimo 1',
    ),
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
  hitPoints: '',
  privateInformation: '',
  tagIds: [],
  characteristicIds: [],
  talentIds: [],
};
