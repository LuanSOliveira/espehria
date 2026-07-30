import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const utilityFormSchema = z.object({
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

export type UtilityFormData = z.infer<typeof utilityFormSchema>;

export const utilityFormResolver = zodResolver(utilityFormSchema);

export const utilityFormDefaultValues: UtilityFormData = {
  name: '',
  referenceImage: '',
  price: '',
  tagIds: [],
  description: '',
  privateInformation: '',
};
