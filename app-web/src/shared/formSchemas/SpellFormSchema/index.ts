import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const spellFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImage: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  tagIds: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export type SpellFormData = z.infer<typeof spellFormSchema>;

export const spellFormResolver = zodResolver(spellFormSchema);

export const spellFormDefaultValues: SpellFormData = {
  name: '',
  referenceImage: '',
  tagIds: [],
  description: '',
};
