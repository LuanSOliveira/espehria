import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const materialFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImage: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  price: z.string(),
  tagIds: z.array(z.string()).optional(),
  description: z.string(),
  privateInformation: z.string(),
});

export type MaterialFormData = z.infer<typeof materialFormSchema>;

export const materialFormResolver = zodResolver(materialFormSchema);

export const materialFormDefaultValues: MaterialFormData = {
  name: '',
  referenceImage: '',
  price: '',
  tagIds: [],
  description: '',
  privateInformation: '',
};
