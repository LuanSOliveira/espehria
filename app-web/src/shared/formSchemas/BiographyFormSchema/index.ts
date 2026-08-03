import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const biographyFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  imageReference: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
});

export type BiographyFormData = z.infer<typeof biographyFormSchema>;

export const biographyFormResolver = zodResolver(biographyFormSchema);

export const biographyFormDefaultValues: BiographyFormData = {
  name: '',
  description: '',
  tagIds: [],
  imageReference: '',
};
