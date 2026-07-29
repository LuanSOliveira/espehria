import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const eventFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImageUrl: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  startYear: z
    .string()
    .refine(
      (value) => value === '' || /^\d+$/.test(value),
      'Informe apenas números inteiros',
    ),
  endYear: z
    .string()
    .refine(
      (value) => value === '' || /^\d+$/.test(value),
      'Informe apenas números inteiros',
    ),
  description: z.string(),
  privateInformation: z.string(),
  tagIds: z.array(z.string()).optional(),
  eraId: z.string(),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

export const eventFormResolver = zodResolver(eventFormSchema);

export const eventFormDefaultValues: EventFormData = {
  name: '',
  referenceImageUrl: '',
  startYear: '',
  endYear: '',
  description: '',
  privateInformation: '',
  tagIds: [],
  eraId: '',
};
