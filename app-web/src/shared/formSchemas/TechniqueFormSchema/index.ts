import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const techniqueFormSchema = z.object({
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

export type TechniqueFormData = z.infer<typeof techniqueFormSchema>;

export const techniqueFormResolver = zodResolver(techniqueFormSchema);

export const techniqueFormDefaultValues: TechniqueFormData = {
  name: '',
  referenceImage: '',
  tagIds: [],
  description: '',
};
