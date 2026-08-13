import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const traitFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  traitTypeId: z.string(),
  tagIds: z.array(z.string()).optional(),
  description: z.string(),
});

export type TraitFormData = z.infer<typeof traitFormSchema>;

export const traitFormResolver = zodResolver(traitFormSchema);

export const traitFormDefaultValues: TraitFormData = {
  name: '',
  traitTypeId: '',
  tagIds: [],
  description: '',
};
