import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const familyFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImage: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  classification: z.string().min(1, 'Informe a classificação'),
  tagIds: z.array(z.string()).optional(),
  description: z.string(),
  privateInformation: z.string(),
});

export type FamilyFormData = z.infer<typeof familyFormSchema>;

export const familyFormResolver = zodResolver(familyFormSchema);

export const familyFormDefaultValues: FamilyFormData = {
  name: '',
  referenceImage: '',
  classification: '',
  tagIds: [],
  description: '',
  privateInformation: '',
};
