import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const eraFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImageUrl: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  description: z.string(),
  privateInformation: z.string(),
  tagIds: z.array(z.string()).optional(),
  order: z.string().min(1, 'Selecione a ordenação'),
});

export type EraFormData = z.infer<typeof eraFormSchema>;

export const eraFormResolver = zodResolver(eraFormSchema);

export const eraFormDefaultValues: EraFormData = {
  name: '',
  referenceImageUrl: '',
  description: '',
  privateInformation: '',
  tagIds: [],
  order: '',
};
