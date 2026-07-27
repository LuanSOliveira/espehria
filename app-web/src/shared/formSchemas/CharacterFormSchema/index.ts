import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const characterFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImage: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  tagIds: z.array(z.string()).optional(),
  isDead: z.boolean(),
  raceId: z.string().optional(),
  description: z.string(),
});

export type CharacterFormData = z.infer<typeof characterFormSchema>;

export const characterFormResolver = zodResolver(characterFormSchema);

export const characterFormDefaultValues: CharacterFormData = {
  name: '',
  referenceImage: '',
  tagIds: [],
  isDead: false,
  raceId: '',
  description: '',
};
