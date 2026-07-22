import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const locationFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  type: z.string(),
  referenceImageUrl: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  description: z.string(),
  tagIds: z.array(z.string()).optional(),
});

export type LocationFormData = z.infer<typeof locationFormSchema>;

export const locationFormResolver = zodResolver(locationFormSchema);

export const locationFormDefaultValues: LocationFormData = {
  name: '',
  type: '',
  referenceImageUrl: '',
  description: '',
  tagIds: [],
};
