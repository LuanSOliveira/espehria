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
});

export type DivinityFormData = z.infer<typeof divinityFormSchema>;

export const divinityFormResolver = zodResolver(divinityFormSchema);

export const divinityFormDefaultValues: DivinityFormData = {
  name: '',
  categoryId: '',
  referenceImage: '',
  description: '',
  tagIds: [],
};
