import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const organizationFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImage: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  tagIds: z.array(z.string()).optional(),
  description: z.string(),
  privateInformation: z.string(),
});

export type OrganizationFormData = z.infer<typeof organizationFormSchema>;

export const organizationFormResolver = zodResolver(organizationFormSchema);

export const organizationFormDefaultValues: OrganizationFormData = {
  name: '',
  referenceImage: '',
  tagIds: [],
  description: '',
  privateInformation: '',
};
