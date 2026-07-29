import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const characterFormSchema = z
  .object({
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
    familyId: z.string().optional(),
    secondaryFamilyId: z.string().optional(),
    description: z.string(),
  })
  .refine(
    (data) =>
      !data.familyId || !data.secondaryFamilyId || data.familyId !== data.secondaryFamilyId,
    {
      message: 'A família secundária não pode ser a mesma da família primária.',
      path: ['secondaryFamilyId'],
    },
  );

export type CharacterFormData = z.infer<typeof characterFormSchema>;

export const characterFormResolver = zodResolver(characterFormSchema);

export const characterFormDefaultValues: CharacterFormData = {
  name: '',
  referenceImage: '',
  tagIds: [],
  isDead: false,
  raceId: '',
  familyId: '',
  secondaryFamilyId: '',
  description: '',
};
